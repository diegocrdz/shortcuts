/*
 * Logic for managing tags
 */

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use crate::shortcuts::save;
use crate::shortcuts::load;

// Tag struct
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: String, // Hex color code for the tag
}

// Get the path to the tags configuration file
fn tags_path(app: &AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().expect("no se pudo resolver app_data_dir");
    fs::create_dir_all(&dir).ok();
    dir.join("tags.json")
}

// Load tags from the configuration file
pub fn load_tags(app: &AppHandle) -> Vec<Tag> {
    let path = tags_path(app);
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

// Save tags to the configuration file
pub fn save_tags(app: &AppHandle, tags: &[Tag]) -> Result<(), String> {
    let path = tags_path(app);
    let json = serde_json::to_string_pretty(tags).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

// Get tags
#[tauri::command]
pub fn get_tags(app: AppHandle) -> Vec<Tag> {
    load_tags(&app)
}

// Create a tag
#[tauri::command]
pub fn create_tag(app: AppHandle, tag: Tag) -> Result<Vec<Tag>, String> {
    let mut tags = load_tags(&app);
    tags.push(tag);
    save_tags(&app, &tags)?;
    Ok(tags)
}

// Update a tag
#[tauri::command]
pub fn update_tag(app: AppHandle, tag: Tag) -> Result<Vec<Tag>, String> {
    let mut tags = load_tags(&app);
    if let Some(existing) = tags.iter_mut().find(|t| t.id == tag.id) {
        *existing = tag;
    }
    save_tags(&app, &tags)?;
    Ok(tags)
}

// Delete a tag
#[tauri::command]
pub fn delete_tag(app: AppHandle, id: String) -> Result<Vec<Tag>, String> {
    let mut tags = load_tags(&app);
    tags.retain(|t| t.id != id);
    save_tags(&app, &tags)?;

    // Remove its reference from all shortcuts
    let mut shortcuts = load(&app);
    for s in shortcuts.iter_mut() {
        s.tags.retain(|tag_id| tag_id != &id);
    }
    save(&app, &shortcuts)?;

    Ok(tags)
}