/* 
 * Scan and detect launcher and game shortcuts from supported providers
 */

use crate::shortcuts;
use crate::shortcuts::{Shortcut, remove_shortcut_icon};
use crate::steam::scan_steam;
use crate::epic_games::scan_epic;
use crate::riot::scan_riot;
use crate::excluded::{load as load_excluded};
use std::collections::HashSet;
use tauri::AppHandle;

// Rank categories for sorting
// Categories are ranked to ensure launchers appear before games, and other categories follow
fn category_rank(category: &str) -> u8 {
    match category {
        "launchers" => 0,
        "games" => 1,
        _ => 2,
    }
}

// Rank sources for sorting
// Sources are ranked to ensure Steam appears first, followed by Epic, Riot, and others
fn source_rank(source: &str) -> u8 {
    match source {
        "steam" => 0,
        "epic" => 1,
        "riot" => 2,
        _ => 3,
    }
}

// Scan for installed games and launchers from supported providers, returning a list of detected shortcuts
#[tauri::command]
pub fn scan_installed_games(app: AppHandle) -> Vec<Shortcut> {
    let excluded_ids: HashSet<String> = load_excluded(&app).into_iter().map(|s| s.id).collect();

    let mut all = Vec::new();
    all.extend(scan_steam(&app, &excluded_ids));
    all.extend(scan_epic(&app, &excluded_ids));
    all.extend(scan_riot(&app, &excluded_ids));

    // Remove duplicates based on the shortcut ID, keeping the first occurrence
    let mut seen = std::collections::HashSet::new();
    all.retain(|shortcut| seen.insert(shortcut.id.clone()));

    // Sort by category, then source, then name, then ID
    all.sort_by(|left, right| {
        category_rank(&left.category)
            .cmp(&category_rank(&right.category))
            .then_with(|| source_rank(&left.source).cmp(&source_rank(&right.source)))
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
            .then_with(|| left.id.cmp(&right.id))
    });

    all
}

// Sync the scanned shortcuts with the stored shortcuts, adding any new ones
#[tauri::command]
pub fn sync_shortcuts(app: AppHandle) -> Result<Vec<Shortcut>, String> {
    let current = shortcuts::load(&app);
    let scanned = scan_installed_games(app.clone());

    let scanned_ids: HashSet<String> = scanned.iter().map(|s| s.id.clone()).collect();
    let existing_ids: HashSet<String> = current.iter().map(|s| s.id.clone()).collect();

    // Delete icons for shortcuts that are no longer detected and not manual
    current
        .iter()
        .filter(|s| s.source != shortcuts::SOURCE_MANUAL && !scanned_ids.contains(&s.id))
        .for_each(remove_shortcut_icon);

    // Always keep manual shortcuts
    // and remove any that are no longer detected
    let mut updated: Vec<Shortcut> = current
        .into_iter()
        .filter(|s| s.source == shortcuts::SOURCE_MANUAL || scanned_ids.contains(&s.id))
        .collect();

    // Add any new shortcuts that were detected
    for shortcut in scanned {
        if !existing_ids.contains(&shortcut.id) {
            updated.push(shortcut);
        }
    }

    shortcuts::save(&app, &updated)?;
    Ok(updated)
}