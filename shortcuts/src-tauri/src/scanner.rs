/* 
 * Scan and detect launcher and game shortcuts from supported providers
 */

use crate::shortcuts::Shortcut;
use crate::steam::scan_steam;
use crate::epic_games::scan_epic;
use crate::riot::scan_riot;

fn category_rank(category: &str) -> u8 {
    match category {
        "launchers" => 0,
        "games" => 1,
        _ => 2,
    }
}

fn source_rank(source: &str) -> u8 {
    match source {
        "steam" => 0,
        "epic" => 1,
        "riot" => 2,
        _ => 3,
    }
}

#[tauri::command]
pub fn scan_installed_games() -> Vec<Shortcut> {
    let mut all = Vec::new();
    all.extend(scan_steam());
    all.extend(scan_epic());
    all.extend(scan_riot());

    let mut seen = std::collections::HashSet::new();
    all.retain(|shortcut| seen.insert(shortcut.id.clone()));

    all.sort_by(|left, right| {
        category_rank(&left.category)
            .cmp(&category_rank(&right.category))
            .then_with(|| source_rank(&left.source).cmp(&source_rank(&right.source)))
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
            .then_with(|| left.id.cmp(&right.id))
    });

    all
}