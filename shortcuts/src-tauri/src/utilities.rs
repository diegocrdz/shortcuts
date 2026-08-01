use std::path::PathBuf;
/**
 * Utility functions
 */
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use winreg::enums::*;
use winreg::RegKey;

#[tauri::command]
pub fn set_auto_minimize_paused(paused: bool, state: tauri::State<'_, Arc<AtomicBool>>) {
    state.store(paused, Ordering::SeqCst);
}

// Find the install location of any application from the Windows uninstall registry
pub fn find_install_location_from_uninstall(display_name_match: &str) -> Option<PathBuf> {
    let roots = [
        (
            HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        ),
        (
            HKEY_LOCAL_MACHINE,
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
        ),
    ];

    // Iterate through the registry roots and search for the uninstall entry matching the display name
    for (hive, subkey_path) in roots {
        let hive_key = RegKey::predef(hive);
        let Ok(uninstall_key) = hive_key.open_subkey(subkey_path) else {
            continue;
        };

        for name in uninstall_key.enum_keys().flatten() {
            let Ok(entry) = uninstall_key.open_subkey(&name) else {
                continue;
            };
            let display_name: String = entry.get_value("DisplayName").unwrap_or_default();

            if display_name
                .to_lowercase()
                .contains(&display_name_match.to_lowercase())
            {
                if let Ok(install_location) = entry.get_value::<String, _>("InstallLocation") {
                    if !install_location.is_empty() {
                        return Some(PathBuf::from(install_location));
                    }
                }
            }
        }
    }
    None
}
