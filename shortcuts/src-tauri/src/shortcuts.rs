/*
 * Logic for managing shortcuts
 */

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use windows_icons::get_icon_base64_by_path;
use base64::{Engine as _, engine::general_purpose};
use win32_version_info::VersionInfo;

// Shortcut struct
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Shortcut {
    pub id: String,
    pub name: String,
    pub target: String, // Route to .exe file or URI
    pub icon_path: Option<String>,
    pub args: Option<String>, // Optional arguments for the target
    pub source: String,       // "manual" | "steam" | "epic"
    pub is_favorite: bool,
    pub tags: Vec<String>, // Tags for categorization
    pub category: String, // "launcher" | "game" | "other"
}

// Function to get the path to the shortcuts configuration file
fn config_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("could not determine app data directory");
    fs::create_dir_all(&dir).ok(); // If the directory doesn't exist, create it
    dir.join("shortcuts.json")
}

// Load shortcuts from the configuration file
pub fn load(app: &AppHandle) -> Vec<Shortcut> {
    let path = config_path(app);
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Vec::new(), // First run or file not found, return empty vector
    }
}

// Save shortcuts to the configuration file
pub fn save(app: &AppHandle, shortcuts: &[Shortcut]) -> Result<(), String> {
    let path = config_path(app);
    let json = serde_json::to_string_pretty(shortcuts).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

// Tauri commands

// Get a friendly name for the executable
#[tauri::command]
pub fn get_exe_friendly_name(exe_path: String) -> Option<String> {
    VersionInfo::from_file(&exe_path)
        .ok()
        .map(|info| info.file_description)
        .filter(|desc| !desc.trim().is_empty())
}

// Get shortcut list
#[tauri::command]
pub fn get_shortcuts(app: AppHandle) -> Vec<Shortcut> {
    load(&app)
}

// Create shortcut
#[tauri::command]
pub fn create_shortcut(app: AppHandle, mut shortcut: Shortcut) -> Result<Vec<Shortcut>, String> {
    let mut list = load(&app);

    // Si ya existe un shortcut con este id, no lo dupliques
    if list.iter().any(|s| s.id == shortcut.id) {
        return Ok(list);
    }

    if shortcut.source == "manual" && shortcut.icon_path.is_none() {
        shortcut.icon_path = extract_and_save_icon(&app, &shortcut.target, &shortcut.id);
    }

    list.push(shortcut);
    save(&app, &list)?;
    Ok(list)
}

// Delete shortcut
#[tauri::command]
pub fn delete_shortcut(app: AppHandle, id: String) -> Result<Vec<Shortcut>, String> {
    let mut list = load(&app);
    list.retain(|s| s.id != id);
    save(&app, &list)?;
    Ok(list)
}

// Update a shortcut
#[tauri::command]
pub fn update_shortcut(app: AppHandle, shortcut: Shortcut) -> Result<Vec<Shortcut>, String> {
    let mut list = load(&app);
    if let Some(existing) = list.iter_mut().find(|s| s.id == shortcut.id) {
        *existing = shortcut;
    }
    save(&app, &list)?;
    Ok(list)
}

// Launch shortcut
#[tauri::command]
pub fn launch_shortcut(shortcut: Shortcut) -> Result<(), String> {
    // Launch the target application or URI
    if shortcut.target.contains("://") {
        let escaped_target = shortcut.target.replace("&", "^&");
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &escaped_target])
            .spawn()
            .map_err(|e| e.to_string())?;
    } else {
        let mut cmd = std::process::Command::new(&shortcut.target);
        if let Some(args) = &shortcut.args {
            if !args.is_empty() {
                cmd.args(args.split_whitespace());
            }
        }
        cmd.spawn().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Extract the icon from the target executable and save it
// Only for manual shortcuts
fn extract_and_save_icon(app: &AppHandle, exe_path: &str, id: &str) -> Option<String> {
    let base64_str = get_icon_base64_by_path(exe_path).ok()?;
    let bytes = general_purpose::STANDARD.decode(base64_str).ok()?;

    let icons_dir = app.path().app_data_dir().ok()?.join("icons");
    fs::create_dir_all(&icons_dir).ok()?;

    let icon_path = icons_dir.join(format!("{}.png", id));
    fs::write(&icon_path, bytes).ok()?;

    icon_path.to_str().map(|s| s.to_string())
}