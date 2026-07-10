// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::{Manager, WindowEvent};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        // Setup the window and tray icon behavior
        .setup(|app| {
            // Get the main window
            let window = app.get_webview_window("main").unwrap();

            // Hide the window when it loses focus
            let window_for_blur = window.clone();
            window.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    let _ = window_for_blur.hide();
                }
            });

            // Toggle the window visibility when the tray icon is clicked
            let window_for_tray = window.clone();
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Shortcuts")
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if window_for_tray.is_visible().unwrap_or(false) {
                            let _ = window_for_tray.hide();
                        } else {
                            let _ = window_for_tray.show();
                            let _ = window_for_tray.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
