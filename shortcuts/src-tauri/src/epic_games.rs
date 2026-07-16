/**
 * Scan and detect epic launcher games on the system
 */

use crate::shortcuts::{game_shortcut, launcher_shortcut, Shortcut, SOURCE_EPIC};
use serde::Deserialize;
use std::path::PathBuf;
use std::fs;

// EpicManifest struct to deserialize the JSON manifest files
#[derive(Debug, Deserialize)]
struct EpicManifest {
    #[serde(rename = "DisplayName")]
    display_name: Option<String>,
    #[serde(rename = "AppName")]
    app_name: Option<String>,
    #[serde(rename = "LaunchExecutable")]
    launch_executable: Option<String>,
    #[serde(rename = "CatalogNamespace")]
    catalog_namespace: Option<String>,
    #[serde(rename = "CatalogItemId")]
    catalog_item_id: Option<String>,
}

// Get the Epic Games installation path by checking common directories
fn epic_install_path() -> Option<PathBuf> {
    let candidates = [
        r"C:\Program Files (x86)\Epic Games\Launcher\Portal\Binaries\Win64",
        r"C:\Program Files\Epic Games\Launcher\Portal\Binaries\Win64",
    ];

    candidates
        .iter()
        .map(PathBuf::from)
        .find(|p| p.exists())
}

// Scan for installed Epic Games and return them as a list of shortcuts
pub fn scan_epic() -> Vec<Shortcut> {
    let mut results = Vec::new();

    // Epic Games launcher

    if let Some(epic_path) = epic_install_path() {
        let launcher = epic_path.join("EpicGamesLauncher.exe");

        if launcher.exists() {
            results.push(launcher_shortcut(
                "launcher-epic",
                "Epic Games",
                launcher.to_string_lossy().to_string(),
                SOURCE_EPIC,
            ));
        }
    }

    // Epic Games games

    let manifests_dir = PathBuf::from(r"C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests");
    let Ok(entries) = fs::read_dir(&manifests_dir) else { return results; };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("item") { continue; }

        let Ok(content) = fs::read_to_string(&path) else { continue; };
        let Ok(manifest) = serde_json::from_str::<EpicManifest>(&content) else { continue; };

        // Skip if the launch executable is empty
        if manifest.launch_executable.as_deref().unwrap_or("").is_empty() { continue; }

        let (Some(name), Some(app_name)) = (manifest.display_name, manifest.app_name) else { continue; };

        let target = match (&manifest.catalog_namespace, &manifest.catalog_item_id) {
            (Some(ns), Some(item_id)) if !ns.is_empty() && !item_id.is_empty() => {
                format!("com.epicgames.launcher://apps/{}%3A{}%3A{}?action=launch&silent=true", ns, item_id, app_name)
            }
            _ => format!("com.epicgames.launcher://apps/{}?action=launch&silent=true", app_name),
        };

        results.push(game_shortcut(
            format!("epic-{}", app_name),
            name,
            target,
            SOURCE_EPIC,
        ));
    }
    results
}