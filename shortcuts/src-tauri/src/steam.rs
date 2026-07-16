/* 
 * Scan and detect steam games on the system
 */

use crate::shortcuts::{game_shortcut, launcher_shortcut, Shortcut, SOURCE_STEAM};
use std::fs;
use std::path::PathBuf;
use std::path::Path;

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

// Scan for installed Steam games and return them as a list of shortcuts
pub fn scan_steam() -> Vec<Shortcut> {
    let mut results = Vec::new();
    let Some(steam_path) = steam_install_path() else { return results; };

    // Steam launcher

    let launcher = steam_path.join("Steam.exe");

    if launcher.exists() {
        results.push(launcher_shortcut(
            "steam",
            "Steam",
            launcher.to_string_lossy().to_string(),
            SOURCE_STEAM,
        ));
    }

    // Steam games

    for lib in steam_library_folders(&steam_path) {
        let steamapps = lib.join("steamapps");
        let Ok(entries) = fs::read_dir(&steamapps) else { continue; };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("acf") { continue; }

            let Ok(content) = fs::read_to_string(&path) else { continue; };
            let (Some(name), Some(appid)) = (vdf_value(&content, "name"), vdf_value(&content, "appid")) else { continue; };

            // Create shortcuts
            results.push(game_shortcut(
                format!("steam-{}", appid),
                name,
                format!("steam://rungameid/{}", appid),
                SOURCE_STEAM,
            ));
        }
    }
    results
}