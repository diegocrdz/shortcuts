/* 
 * Scan and detect steam games on the system
 */

use crate::shortcuts::{game_shortcut, launcher_shortcut, extract_icon_from_exe, icons_dir, Shortcut, SOURCE_STEAM};
use std::fs;
use std::path::PathBuf;
use std::path::Path;
use std::collections::HashSet;
use tauri::AppHandle;

/// Extract the value of a key from a VDF (Valve Data Format) string
fn vdf_value(content: &str, key: &str) -> Option<String> {
    let needle = format!("\"{}\"", key);
    let line = content.lines().find(|l| l.contains(&needle))?;
    let parts: Vec<&str> = line.split('"').collect();
    parts.get(3).map(|s| s.to_string())
}

// Get the Steam installation path by checking common directories
fn steam_install_path() -> Option<PathBuf> {
    let candidates = [r"C:\Program Files (x86)\Steam", r"C:\Program Files\Steam"];
    candidates.iter().map(PathBuf::from).find(|p| p.exists())
}

// Get the Steam library folders by reading the libraryfolders.vdf file
fn steam_library_folders(steam_path: &Path) -> Vec<PathBuf> {
    let mut libs = vec![steam_path.to_path_buf()];
    let vdf_path = steam_path.join("steamapps").join("libraryfolders.vdf");
    if let Ok(content) = fs::read_to_string(&vdf_path) {
        for line in content.lines() {
            if line.contains("\"path\"") {
                if let Some(v) = vdf_value(line, "path") {
                    libs.push(PathBuf::from(v.replace("\\\\", "\\")));
                }
            }
        }
    }
    libs
}

// Find the smallest icon file in the Steam appcache for a given appid
fn find_steam_icon(steam_path: &Path, appid: &str) -> Option<PathBuf> {
    let dir = steam_path.join("appcache").join("librarycache").join(appid);
    let entries = fs::read_dir(&dir).ok()?;

    entries
        .flatten()
        .filter(|entry| entry.path().is_file()) // Only consider files
        .min_by_key(|entry| entry.metadata().map(|m| m.len()).unwrap_or(u64::MAX))
        .map(|entry| entry.path())
}

// Save the Steam game icon to the app's icons directory
fn save_steam_game_icon(app: &AppHandle, steam_path: &Path, appid: &str) -> Option<String> {
    let cached = find_steam_icon(steam_path, appid)?;
    let ext = cached.extension().and_then(|e| e.to_str()).unwrap_or("jpg");

    let dest = icons_dir(app)?.join(format!("steam-{}.{}", appid, ext));
    fs::copy(&cached, &dest).ok()?;
    dest.to_str().map(|s| s.to_string())
}

// Scan for installed Steam games and return them as a list of shortcuts
pub fn scan_steam(app: &AppHandle, excluded_ids: &HashSet<String>) -> Vec<Shortcut> {
    let mut results = Vec::new();
    let Some(steam_path) = steam_install_path() else { return results; };

    // Launcher

    let launcher = steam_path.join("Steam.exe");
    if launcher.exists() {
        let mut shortcut = launcher_shortcut("steam", "Steam", launcher.to_string_lossy().to_string(), SOURCE_STEAM);
        shortcut.icon_path = extract_icon_from_exe(app, &shortcut.target, &shortcut.id);
        results.push(shortcut);
    }

    // Games

    for lib in steam_library_folders(&steam_path) {
        let steamapps = lib.join("steamapps");
        let Ok(entries) = fs::read_dir(&steamapps) else { continue; };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("acf") { continue; }

            let Ok(content) = fs::read_to_string(&path) else { continue; };
            let (Some(name), Some(appid)) = (vdf_value(&content, "name"), vdf_value(&content, "appid")) else { continue; };

            let id = format!("steam-{}", appid);
            if excluded_ids.contains(&id) { continue; } // Skip excluded shortcuts

            let mut shortcut = game_shortcut(
                id,
                name,
                format!("steam://rungameid/{}", appid),
                SOURCE_STEAM,
            );
            shortcut.icon_path = save_steam_game_icon(app, &steam_path, &appid);

            results.push(shortcut);
        }
    }
    results
}