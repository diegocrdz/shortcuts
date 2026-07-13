// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::{Manager, WindowEvent};
use std::time::Duration;

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

            // Apply acrylic effect on Windows
            #[cfg(target_os = "windows")]
            {
                use window_vibrancy::apply_acrylic;
                let _ = apply_acrylic(&window, Some((18, 18, 18, 80)));
            }

            // Minimize when it loses focus
            let window_for_blur = window.clone();
            window.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    let window_check = window_for_blur.clone();
                    // Delay minimization to avoid immediate minimize
                    tauri::async_runtime::spawn(async move {
                        tokio::time::sleep(Duration::from_millis(150)).await;
                        if !window_check.is_focused().unwrap_or(true) {
                            let _ = window_check.minimize();
                        }
                    });
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
