/*
 * Logic for managing shortcuts
 */

use crate::excluded;
use crate::epic_games::epic_launcher_exe;
use crate::categories;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use windows_icons::get_icon_base64_by_path;
use base64::{Engine as _, engine::general_purpose};
use win32_version_info::VersionInfo;

pub const SOURCE_MANUAL: &str = "manual";
pub const SOURCE_STEAM: &str = "steam";
pub const SOURCE_EPIC: &str = "epic";
pub const SOURCE_RIOT: &str = "riot";

pub const CATEGORY_LAUNCHERS: &str = "launchers";
pub const CATEGORY_GAMES: &str = "games";

// Shortcut struct
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Shortcut {
    pub id: String,
    pub name: String,
    pub target: String, // Route to .exe file or URI
    pub icon_path: Option<String>,
    pub args: Option<String>, // Optional arguments for the target
    pub source: String,       // "manual" | "steam" | "epic" | "riot"
    pub is_favorite: bool,
    pub tags: Vec<String>, // Tags for categorization
    pub category: String, // "launchers" | "games" | custom categories
}

pub fn build_shortcut(
    id: impl Into<String>,
    name: impl Into<String>,
    target: impl Into<String>,
    args: Option<String>,
    source: impl Into<String>,
    category: impl Into<String>,
) -> Shortcut {
    Shortcut {
        id: id.into(),
        name: name.into(),
        target: target.into(),
        icon_path: None,
        args,
        source: source.into(),
        is_favorite: false,
        tags: vec![],
        category: category.into(),
    }
}

pub fn launcher_shortcut(
    id: impl Into<String>,
    name: impl Into<String>,
    target: impl Into<String>,
    source: impl Into<String>,
) -> Shortcut {
    build_shortcut(id, name, target, None, source, CATEGORY_LAUNCHERS)
}

pub fn game_shortcut(
    id: impl Into<String>,
    name: impl Into<String>,
    target: impl Into<String>,
    source: impl Into<String>,
) -> Shortcut {
    build_shortcut(id, name, target, None, source, CATEGORY_GAMES)
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

// Helper function to get default category name and icon based on category ID
fn category_defaults(id: &str) -> (&'static str, &'static str) {
    match id {
        CATEGORY_LAUNCHERS => ("Launchers", "rocket"),
        CATEGORY_GAMES => ("Games", "gamepad"),
        _ => ("", "Folder"),
    }
}

// Create shortcut
#[tauri::command]
pub fn create_shortcut(app: AppHandle, mut shortcut: Shortcut) -> Result<Vec<Shortcut>, String> {
    let mut list = load(&app);

    // If the shortcut already exists, do not add it again
    if list.iter().any(|s| s.id == shortcut.id) {
        return Ok(list);
    }

    // If the shortcut was manually added,
    // try to extract the icon from the target executable
    if shortcut.source == SOURCE_MANUAL && shortcut.icon_path.is_none() {
        shortcut.icon_path = extract_icon_from_exe(&app, &shortcut.target, &shortcut.id);
    }

    // Only auto-create a category if the shortcut actually has one assigned.
    // An empty category means "uncategorized" and should never become a real category.
    if !shortcut.category.is_empty() {
        let (name, icon) = category_defaults(&shortcut.category);
        categories::ensure_category_exists(&app, &shortcut.category, name, icon);
    }

    list.push(shortcut);
    save(&app, &list)?;
    Ok(list)
}

// Delete the icon file associated with a shortcut, if it has one.
pub fn remove_shortcut_icon(shortcut: &Shortcut) {
    if let Some(icon_path) = &shortcut.icon_path {
        let _ = fs::remove_file(icon_path);
    }
}

// Delete shortcut
#[tauri::command]
pub fn delete_shortcut(app: AppHandle, id: String) -> Result<Vec<Shortcut>, String> {
    let mut list = load(&app);

    // If the shortcut is not manual, add it to the excluded list
    if let Some(shortcut) = list.iter().find(|s| s.id == id) {
        if shortcut.source != SOURCE_MANUAL {
            excluded::add(app.clone(), shortcut.clone())?;
        }
        remove_shortcut_icon(shortcut);
    }

    // Remove the shortcut from the list
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

// Check if a process is running by its name
fn is_process_running(process_name: &str) -> bool {
    let output = std::process::Command::new("tasklist")
        .args(["/FI", &format!("IMAGENAME eq {}", process_name), "/NH"])
        .output();

    match output {
        Ok(out) => String::from_utf8_lossy(&out.stdout)
            .to_lowercase()
            .contains(&process_name.to_lowercase()),
        Err(_) => false,
    }
}

// Wait for a process to start running, with a timeout
fn wait_for_process(process_name: &str, timeout_secs: u64) -> bool {
    let start = std::time::Instant::now();
    while start.elapsed().as_secs() < timeout_secs {
        if is_process_running(process_name) {
            return true;
        }
        std::thread::sleep(std::time::Duration::from_millis(500));
    }
    false
}

// Launch shortcut
#[tauri::command]
pub fn launch_shortcut(shortcut: Shortcut) -> Result<(), String> {
    // If the shortcut is an Epic Games game,
    // ensure the Epic Games Launcher is running before launching the game
    if shortcut.source == SOURCE_EPIC {
        if !is_process_running("EpicGamesLauncher.exe") {
            if let Some(launcher_exe) = epic_launcher_exe() {
                std::process::Command::new(&launcher_exe)
                    .spawn()
                    .map_err(|e| e.to_string())?;

                wait_for_process("EpicGamesLauncher.exe", 15);
                // Wait a few seconds to ensure the launcher is fully
                // initialized before launching the game
                std::thread::sleep(std::time::Duration::from_secs(3));
            }
        }
    }

    if shortcut.target.contains("://") {
        open::that(&shortcut.target).map_err(|e| e.to_string())?;
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

// Get the path to the icons directory
pub fn icons_dir(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_data_dir().ok()?.join("icons");
    fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

// Extract the icon from the target executable and save it
// Returns the path to the saved icon if successful
pub fn extract_icon_from_exe(app: &AppHandle, exe_path: &str, id: &str) -> Option<String> {
    let base64_str = get_icon_base64_by_path(exe_path).ok()?;
    let bytes = general_purpose::STANDARD.decode(base64_str).ok()?;

    let icon_path = icons_dir(app)?.join(format!("{}.png", id));
    fs::write(&icon_path, bytes).ok()?;

    icon_path.to_str().map(|s| s.to_string())
}