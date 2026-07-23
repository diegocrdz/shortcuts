/**
 * Settings
 */

use tauri::AppHandle;
use crate::shortcuts::{Shortcut, save};
use crate::tags::{Tag, save_tags};
use crate::categories::{Category, save_categories};
use crate::excluded::clear_excluded;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub theme: String, // "light" | "dark" | "system"
    pub language: String, // "en" | "es"
    pub update_interval: u32, // hours between automatic sync with game launchers
    pub position: String, // "bottom-center" | "bottom-left" | "center"
    pub show_onboarding: bool, // Show onboarding screen on first launch
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
            theme: "system".into(),
            language: detect_system_language(),
            update_interval: 6,
            position: "bottom-center".into(),
            show_onboarding: true,
        }
    }
}

// Get the path to the settings configuration file
fn settings_path(app: &AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().expect("could not determine app data directory");
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