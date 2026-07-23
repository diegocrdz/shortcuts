/**
 * Entry point for the Tauri application.
 *
 * Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
 */

mod shortcuts;
mod excluded;
mod tags;
mod categories;
mod steam;
mod epic_games;
mod riot;
mod scanner;
mod settings;
mod utilities;
use tauri::{Manager, Emitter};
use std::sync::{Arc, atomic::{AtomicBool, AtomicU64, Ordering}};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState, Modifiers, Code};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        // Global shortcut for toggling the window visibility
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            let is_minimized = window.is_minimized().unwrap_or(false);
                            let is_focused = window.is_focused().unwrap_or(false);

                            if is_visible && !is_minimized && is_focused {
                                // Is visible, not minimized, and focused -> minimize it
                                let _ = window.minimize();
                            } else {
                                // Either not visible, minimized, or not focused -> unminimize and focus it
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build()
        )
        // Commands for the frontend to call into Rust
        .invoke_handler(tauri::generate_handler![
            utilities::set_auto_minimize_paused,
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
            tags::reorder_tags,
            categories::get_categories,
            categories::create_category,
            categories::update_category,
            categories::delete_category,
            categories::reorder_categories,
            scanner::scan_installed_games,
            scanner::sync_shortcuts,
            settings::get_settings,
            settings::update_settings,
            settings::reset_settings,
            excluded::get_excluded,
            excluded::delete_excluded,
            excluded::restore_excluded,
            excluded::clear_excluded,
        ])
        // Setup the window
        .setup(|app| {
            // Get the main window
            let window = app.get_webview_window("main").unwrap();
            let auto_minimize_paused = Arc::new(AtomicBool::new(false));
            app.manage(auto_minimize_paused.clone());

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

            // Minimize the window if the app is not focused
            let app_handle = app.handle().clone();
            let focus_epoch = Arc::new(AtomicU64::new(0));

            window.on_window_event(move |event| {
                match event {
                    tauri::WindowEvent::Focused(true) => {
                        // Cancel any pending minimize actions by incrementing the epoch
                        focus_epoch.fetch_add(1, Ordering::SeqCst);
                    }
                    tauri::WindowEvent::Focused(false) => {
                        if auto_minimize_paused.load(Ordering::SeqCst) {
                            return;
                        }

                        let my_epoch = focus_epoch.fetch_add(1, Ordering::SeqCst) + 1;
                        let app_handle = app_handle.clone();
                        let focus_epoch = focus_epoch.clone();

                        tauri::async_runtime::spawn(async move {
                            tokio::time::sleep(std::time::Duration::from_millis(200)).await;

                            // Minimize the window only if the epoch hasn't changed, indicating that the app is still unfocused
                            if focus_epoch.load(Ordering::SeqCst) == my_epoch {
                                let _ = app_handle.get_webview_window("main").map(|w| w.minimize());
                            }
                        });
                    }
                    _ => {}
                }
            });

            // Global shortcut to toggle the window visibility
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyS);
            app.global_shortcut().register(shortcut)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
