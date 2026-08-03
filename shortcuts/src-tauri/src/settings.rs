use crate::categories::{save_categories, Category};
use crate::excluded::clear_excluded;
use crate::shortcuts::{save, Shortcut};
use crate::tags::{save_tags, Tag};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
/**
 * Settings
 */
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub auto_start: bool,          // Whether the app should start automatically on system startup
    pub start_behavior: String,    // "normal" | "minimized" | "hidden"
    pub theme: String,             // "light" | "dark" | "system"
    pub language: String,          // "en" | "es"
    pub update_interval: u32,      // hours between automatic sync with game launchers
    pub position: String,          // "bottom-center" | "bottom-left" | "center"
    pub show_onboarding: bool,     // Show onboarding screen on first launch
    pub last_sync: Option<String>, // Last time the shortcuts were synced with the game launchers (ISO 8601 - e.g., "2023-01-01T12:00:00Z")
    pub sync_enabled: bool,        // Whether automatic sync is enabled
}

// Detect the system language
fn detect_system_language() -> String {
    let supported = ["en", "es"];

    sys_locale::get_locale()
        .and_then(|locale| {
            // Only take the first part of the locale (e.g., "en" from "en-US")
            let lang = locale.split(['-', '_']).next()?.to_lowercase();
            supported.contains(&lang.as_str()).then_some(lang)
        })
        .unwrap_or_else(|| "en".to_string())
}

// Default settings
impl Default for Settings {
    fn default() -> Self {
        Self {
            auto_start: false,
            start_behavior: "normal".into(),
            theme: "system".into(),
            language: detect_system_language(),
            update_interval: 6,
            position: "bottom-center".into(),
            show_onboarding: true,
            last_sync: None,
            sync_enabled: true,
        }
    }
}

// Get the path to the settings configuration file
fn settings_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("could not determine app data directory");
    fs::create_dir_all(&dir).ok();
    dir.join("settings.json")
}

// Load settings from the configuration file
pub fn load_settings(app: &AppHandle) -> Settings {
    let path = settings_path(app);
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Settings::default(),
    }
}

// Save settings to the configuration file
pub fn save_settings(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app);
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

// Get settings
#[tauri::command]
pub fn get_settings(app: AppHandle) -> Settings {
    load_settings(&app)
}

// Update settings
#[tauri::command]
pub fn update_settings(app: AppHandle, settings: Settings) -> Result<Settings, String> {
    save_settings(&app, &settings)?;
    Ok(settings)
}

// Delete all shortcuts
// Writes an empty array to the shortcuts.json file
pub fn delete_shortcuts(app: AppHandle) -> Result<(), String> {
    save(&app, &Vec::<Shortcut>::new())?;
    Ok(())
}

// Delete all tags
// Writes an empty array to the tags.json file
pub fn delete_tags(app: AppHandle) -> Result<(), String> {
    save_tags(&app, &Vec::<Tag>::new())?;
    Ok(())
}

// Delete all categories
// Writes an empty array to the categories.json file
pub fn delete_categories(app: AppHandle) -> Result<(), String> {
    save_categories(&app, &Vec::<Category>::new())?;
    Ok(())
}

// Reset all settings
// Deletes the shortcuts.json and tags.json files
#[tauri::command]
pub fn reset_settings(app: AppHandle) -> Result<Settings, String> {
    // Delete shortcuts, tags, and categories
    delete_shortcuts(app.clone())?;
    delete_tags(app.clone())?;
    delete_categories(app.clone())?;

    // Clear the excluded list
    clear_excluded(app.clone())?;

    // Reset settings to default
    save_settings(&app, &Settings::default())?;
    Ok(Settings::default())
}

// Calculates and applies the window position based on the configured setting.
// Called on startup, and whenever the user changes the position setting.
#[tauri::command]
pub fn apply_window_position(app: AppHandle, position: String) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;

    let monitor = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("No monitor")?;

    let scale = monitor.scale_factor();
    let screen_w = monitor.size().width as f64 / scale;
    let screen_h = monitor.size().height as f64 / scale;

    let win_size = window.outer_size().map_err(|e| e.to_string())?;
    let win_w = win_size.width as f64 / scale;
    let win_h = win_size.height as f64 / scale;

    let taskbar = 48.0;
    let margin = 12.0;

    let (x, y) = match position.as_str() {
        "bottom-left" => (margin, screen_h - win_h - margin - taskbar),
        "center" => ((screen_w - win_w) / 2.0, (screen_h - win_h) / 2.0),
        _ => ((screen_w - win_w) / 2.0, screen_h - win_h - margin - taskbar),
    };

    window
        .set_position(tauri::LogicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}

// Applies the startup visibility behavior (normal / minimized / hidden).
// Called only on app startup.
pub fn apply_start_behavior(app: &AppHandle, start_behavior: &str) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;

    match start_behavior {
        "hidden" => {
            window.show().map_err(|e| e.to_string())?;
            window.hide().map_err(|e| e.to_string())?;
        }
        "minimized" => {
            window.show().map_err(|e| e.to_string())?;
            window.minimize().map_err(|e| e.to_string())?;
        }
        _ => {
            window.unminimize().ok();
            window.show().ok();
            window.set_focus().ok();
        }
    }

    Ok(())
}