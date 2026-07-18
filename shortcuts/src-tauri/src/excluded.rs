/*
 * Logic for tracking scanned shortcuts the user has explicitly removed,
 * so scan_installed_games no longer re-adds them.
 */

use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// Get the path to the excluded.json configuration file
fn config_path(app: &AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().expect("could not determine app data directory");
    fs::create_dir_all(&dir).ok();
    dir.join("excluded.json")
}

// Load the excluded shortcuts from the configuration file
pub fn load(app: &AppHandle) -> HashSet<String> {
    let path = config_path(app);
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => HashSet::new(),
    }
}

// Save the excluded shortcuts to the configuration file
fn save(app: &AppHandle, excluded: &HashSet<String>) -> Result<(), String> {
    let path = config_path(app);
    let json = serde_json::to_string_pretty(excluded).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

// Add a shortcut ID to the excluded list
pub fn add(app: &AppHandle, id: &str) -> Result<(), String> {
    let mut excluded = load(app);
    excluded.insert(id.to_string());
    save(app, &excluded)
}

// Get excluded shortcuts
#[tauri::command]
pub fn get_excluded(app: AppHandle) -> Vec<String> {
    load(&app).into_iter().collect()
}

// Remove a shortcut ID from the excluded list
#[tauri::command]
pub fn restore_excluded(app: AppHandle, id: String) -> Result<(), String> {
    let mut excluded = load(&app);
    excluded.remove(&id);
    save(&app, &excluded)
}

// Clear all excluded shortcuts
#[tauri::command]
pub fn clear_excluded(app: AppHandle) -> Result<(), String> {
    save(&app, &HashSet::new())
}