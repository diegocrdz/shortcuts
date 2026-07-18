/**
 * Entry point for the Tauri application.
 *
 * Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
 */

mod shortcuts;
mod excluded;
mod tags;
mod steam;
mod epic_games;
mod riot;
mod scanner;
mod settings;
use tauri::{Manager, Emitter};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        // Commands for the frontend to call into Rust
        .invoke_handler(tauri::generate_handler![
            shortcuts::get_shortcuts,
            shortcuts::create_shortcut,
            shortcuts::update_shortcut,
            shortcuts::delete_shortcut,
            shortcuts::launch_shortcut,
            shortcuts::get_exe_friendly_name,
            tags::get_tags,
            tags::create_tag,
            tags::update_tag,
            tags::delete_tag,
            scanner::scan_installed_games,
            scanner::sync_shortcuts,
            settings::get_settings,
            settings::update_settings,
            settings::reset_settings,
            excluded::get_excluded,
            excluded::restore_excluded,
            excluded::clear_excluded,
        ])
        // Setup the window
        .setup(|app| {
            // Get the main window
            let window = app.get_webview_window("main").unwrap();

            // Apply acrylic effect on Windows
            #[cfg(target_os = "windows")]
            {
                use window_vibrancy::apply_acrylic;
                let _ = apply_acrylic(&window, Some((18, 18, 18, 200)));
            }

            // Start the background task to sync shortcuts periodically
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    if let Ok(updated) = scanner::sync_shortcuts(app_handle.clone()) {
                        // Emit an event to the frontend to notify that shortcuts have been synced
                        let _ = app_handle.emit("shortcuts-synced", updated);
                    }

                    // Sleep for the configured update interval before syncing again
                    let settings = settings::load_settings(&app_handle);
                    let hours = settings.update_interval.max(1); // Ensure at least 1 hour
                    tokio::time::sleep(std::time::Duration::from_secs(hours as u64 * 3600)).await;
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
