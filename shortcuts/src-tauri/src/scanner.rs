/* 
 * Scan and detect steam games on the system
 */

use crate::shortcuts::Shortcut;
use crate::steam::scan_steam;
use crate::epic_games::scan_epic;

#[tauri::command]
pub fn scan_installed_games() -> Vec<Shortcut> {
    let mut all = scan_steam();
    all.extend(scan_epic());
    all
}