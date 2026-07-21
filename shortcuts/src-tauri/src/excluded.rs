/*
 * Logic for tracking scanned shortcuts the user has explicitly removed,
 * so scan_installed_games no longer re-adds them.
 */

use crate::shortcuts::Shortcut;
use crate::scanner::sync_shortcuts;
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
pub fn load(app: &AppHandle) -> Vec<Shortcut> {
    let path = config_path(app);
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

// Save the excluded shortcuts to the configuration file
pub fn save(app: &AppHandle, shortcuts: &[Shortcut]) -> Result<(), String> {
    let path = config_path(app);
    let json = serde_json::to_string_pretty(shortcuts).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

// Get excluded shortcuts
#[tauri::command]
pub fn get_excluded(app: AppHandle) -> Vec<Shortcut> {
    load(&app)
}

// Add a shortcut to the excluded list
pub fn add(app: AppHandle, shortcut: Shortcut) -> Result<Vec<Shortcut>, String> {
    let mut list = load(&app);

    // If the shortcut already exists, do not add it again
    if list.iter().any(|s| s.id == shortcut.id) {
        return Ok(list);
    }

    list.push(shortcut);
    save(&app, &list)?;
    Ok(list)
}

// Delete a shortcut from the excluded list
#[tauri::command]
pub fn delete_excluded(app: AppHandle, id: String) -> Result<Vec<Shortcut>, String> {
    let mut list = load(&app);
    list.retain(|s| s.id != id);
    save(&app, &list)?;
    Ok(list)
}

// Restore a shortcut from the excluded list
#[tauri::command]
pub fn restore_excluded(app: AppHandle, id: String) -> Result<Vec<Shortcut>, String> {
    let mut list = load(&app);
    list.retain(|s| s.id != id);
    save(&app, &list)?;

    // After restoring, sync the shortcuts to re-add it if it's still installed
    sync_shortcuts(app.clone()).map_err(|e| e.to_string())?;
    Ok(list)
}

// Clear all excluded shortcuts
#[tauri::command]
pub fn clear_excluded(app: AppHandle) -> Result<(), String> {
    save(&app, &Vec::new())
}