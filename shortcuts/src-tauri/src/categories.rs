/*
 * Logic for managing categories
 */

use crate::shortcuts::load;
use crate::shortcuts::save;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// Constant for uncategorized shortcuts
pub const UNCATEGORIZED: &str = "";

// Category struct
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub deletable: bool,
}

// Get the path to categories configuration file
fn categories_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("could not determine app data directory");
    fs::create_dir_all(&dir).ok();
    dir.join("categories.json")
}

// Load categories from the configuration file
pub fn load_categories(app: &AppHandle) -> Vec<Category> {
    let path = categories_path(app);
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

// Save categories to the configuration file
pub fn save_categories(app: &AppHandle, categories: &[Category]) -> Result<(), String> {
    let path = categories_path(app);
    let json = serde_json::to_string_pretty(categories).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

// Get categories
#[tauri::command]
pub fn get_categories(app: AppHandle) -> Vec<Category> {
    load_categories(&app)
}

// Create a category
#[tauri::command]
pub fn create_category(app: AppHandle, category: Category) -> Result<Vec<Category>, String> {
    let mut categories = load_categories(&app);
    categories.push(category);
    save_categories(&app, &categories)?;
    Ok(categories)
}

// Update a category
#[tauri::command]
pub fn update_category(app: AppHandle, category: Category) -> Result<Vec<Category>, String> {
    let mut categories = load_categories(&app);
    if let Some(existing) = categories.iter_mut().find(|c| c.id == category.id) {
        *existing = category;
    }
    save_categories(&app, &categories)?;
    Ok(categories)
}

// Delete a category
#[tauri::command]
pub fn delete_category(app: AppHandle, id: String) -> Result<Vec<Category>, String> {
    let mut categories = load_categories(&app);

    // Check if the category is deletable
    if let Some(cat) = categories.iter().find(|c| c.id == id) {
        if !cat.deletable {
            return Err("This category cannot be deleted.".into());
        }
    }

    categories.retain(|c| c.id != id);
    save_categories(&app, &categories)?;

    // Remove its reference from all shortcuts
    // and set their category to 'other'
    let mut shortcuts = load(&app);
    for s in shortcuts.iter_mut() {
        if s.category == id {
            s.category = UNCATEGORIZED.to_string();
        }
    }
    save(&app, &shortcuts)?;

    Ok(categories)
}

// Reorder categories
#[tauri::command]
pub fn reorder_categories(
    app: AppHandle,
    categories: Vec<Category>,
) -> Result<Vec<Category>, String> {
    save_categories(&app, &categories)?;
    Ok(categories)
}

// Ensures a category exists, creating it if necessary.
// Used when a shortcut is assigned a category that hasn't been created yet
// (e.g. the first time games/launchers are synced).
pub fn ensure_category_exists(app: &AppHandle, id: &str, name: &str, icon: &str) {
    let mut categories = load_categories(app);
    if !categories.iter().any(|c| c.id == id) {
        categories.push(Category {
            id: id.to_string(),
            name: name.to_string(),
            icon: icon.to_string(),
            deletable: true,
        });
        let _ = save_categories(app, &categories);
    }
}
