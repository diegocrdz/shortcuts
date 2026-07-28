/**
 * Scan and detect epic launcher games on the system
 */

use crate::shortcuts::{game_shortcut, launcher_shortcut, extract_icon_from_exe, Shortcut, SOURCE_EPIC};
use crate::utilities::find_install_location_from_uninstall;
use serde::Deserialize;
use std::path::PathBuf;
use std::fs;
use tauri::AppHandle;
use std::path::Path;
use std::collections::HashSet;

// EpicManifest struct to deserialize the JSON manifest files
#[derive(Debug, Deserialize)]
struct EpicManifest {
    #[serde(rename = "DisplayName")]
    display_name: Option<String>,
    #[serde(rename = "AppName")]
    app_name: Option<String>,
    #[serde(rename = "LaunchExecutable")]
    launch_executable: Option<String>,
    #[serde(rename = "InstallLocation")]
    install_location: Option<String>,
    #[serde(rename = "CatalogNamespace")]
    catalog_namespace: Option<String>,
    #[serde(rename = "CatalogItemId")]
    catalog_item_id: Option<String>,
}

// Get the Epic Games installation path by checking common directories
fn epic_install_path() -> Option<PathBuf> {
    // 1) Check the uninstall registry for Epic Games Launcher
    if let Some(base) = find_install_location_from_uninstall("Epic Games Launcher") {
        let full = base.join(r"Launcher\Portal\Binaries\Win64");
        if full.exists() { return Some(full); }
        if base.exists() { return Some(base); }
    }

    // 2) Fallback to common installation directories if the registry check fails
    let candidates = [
        r"C:\Program Files (x86)\Epic Games\Launcher\Portal\Binaries\Win64",
        r"C:\Program Files\Epic Games\Launcher\Portal\Binaries\Win64",
    ];
    candidates.iter().map(PathBuf::from).find(|p| p.exists())
}

// Get the path to the Epic Games Launcher executable
pub fn epic_launcher_exe() -> Option<PathBuf> {
    epic_install_path().map(|p| p.join("EpicGamesLauncher.exe"))
}

// Find and extract the icon from the executable in the given directory
fn find_and_extract_icon(app: &AppHandle, exe_dir: &Path, id: &str) -> Option<String> {
    // Exclude certain keywords to avoid picking up non-game executables
    let exclude_keywords = [
        "bootstrapper", "crashreporter", "easyanticheat", "eac", "eos",
        "battleye", "redist", "vc_redist", "unins", "setup", "helper",
    ];

    // Read the directory and filter for .exe files
    let entries = fs::read_dir(exe_dir).ok()?;

    // Collect candidates, filtering out unwanted executables
    let mut candidates: Vec<PathBuf> = entries
        .flatten()
        .map(|entry| entry.path())
        .filter(|path| path.extension().and_then(|e| e.to_str()) == Some("exe"))
        .filter(|path| {
            let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_lowercase();
            !exclude_keywords.iter().any(|kw| name.contains(kw))
        })
        .collect();

    // Sort candidates by file size, preferring smaller executables
    candidates.sort_by_key(|path| fs::metadata(path).map(|m| m.len()).unwrap_or(u64::MAX));

    // Try to extract the icon from each candidate executable
    for candidate in candidates {
        match extract_icon_from_exe(app, &candidate.to_string_lossy(), id) {
            // If extraction is successful, return the icon path
            Some(icon_path) => {
                return Some(icon_path);
            }

            // If extraction fails, continue to the next candidate
            None => {
                continue;
            }
        }
    }
    None
}

// Get the directory where Epic Games manifests are stored
fn epic_manifests_dir() -> Option<PathBuf> {
    let program_data = std::env::var("ProgramData").ok()?;
    Some(PathBuf::from(program_data).join(r"Epic\EpicGamesLauncher\Data\Manifests"))
}

// Scan for installed Epic Games and return them as a list of shortcuts
pub fn scan_epic(app: &AppHandle, excluded_ids: &HashSet<String>) -> Vec<Shortcut> {
    let mut results = Vec::new();

    // Launcher

    if let Some(epic_path) = epic_install_path() {
        let launcher = epic_path.join("EpicGamesLauncher.exe");
        if launcher.exists() {
            let mut shortcut = launcher_shortcut("launcher-epic", "Epic Games", launcher.to_string_lossy().to_string(), SOURCE_EPIC);
            shortcut.icon_path = extract_icon_from_exe(app, &shortcut.target, &shortcut.id);
            results.push(shortcut);
        }
    }

    // Games

    let Some(manifests_dir) = epic_manifests_dir() else { return results; };
    let Ok(entries) = fs::read_dir(&manifests_dir) else { return results; };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("item") { continue; }

        let Ok(content) = fs::read_to_string(&path) else { continue; };
        let Ok(manifest) = serde_json::from_str::<EpicManifest>(&content) else { continue; };

        if manifest.launch_executable.as_deref().unwrap_or("").is_empty() { continue; }

        let (Some(name), Some(app_name)) = (manifest.display_name.clone(), manifest.app_name.clone()) else { continue; };

        let id = format!("epic-{}", app_name);
        if excluded_ids.contains(&id) { continue; } // Skip excluded shortcuts

        let target = match (&manifest.catalog_namespace, &manifest.catalog_item_id) {
            (Some(ns), Some(item_id)) if !ns.is_empty() && !item_id.is_empty() => {
                format!("com.epicgames.launcher://apps/{}%3A{}%3A{}?action=launch&silent=true", ns, item_id, app_name)
            }
            _ => format!("com.epicgames.launcher://apps/{}?action=launch&silent=true", app_name),
        };

        let mut shortcut = game_shortcut(
            id,
            name,
            target,
            SOURCE_EPIC
        );

        // If the manifest has an install location and launch executable, try to extract the icon from the actual executable
        if let (Some(install_location), Some(launch_exe)) = (&manifest.install_location, &manifest.launch_executable) {
            let install_dir = PathBuf::from(install_location);
            let launch_exe_normalized = launch_exe.replace('/', "\\");
            let full_path = install_dir.join(&launch_exe_normalized);

            let exe_dir = full_path.parent().map(|p| p.to_path_buf()).unwrap_or(install_dir);

            shortcut.icon_path = find_and_extract_icon(app, &exe_dir, &shortcut.id);
        }

        results.push(shortcut);
    }
    results
}