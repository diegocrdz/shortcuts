/**
 * Entry point for the Tauri application.
 *
 * Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
 */

mod categories;
mod epic_games;
mod excluded;
mod installed_programs;
mod riot;
mod scanner;
mod settings;
mod shortcuts;
mod steam;
mod tags;
mod utilities;

use std::sync::{
    atomic::{AtomicBool, AtomicU64, Ordering},
    Arc,
};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, WebviewWindow,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Shows the main window, un-minimizes it if needed, and focuses it.
/// Single source of truth for "bring window to front" — used by the
/// global shortcut, the tray menu, and the tray icon click.
fn show_and_focus_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Toggles the main window: minimizes if visible/focused, otherwise brings it to front.
fn toggle_window(app: &AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let is_visible = window.is_visible().unwrap_or(false);
    let is_minimized = window.is_minimized().unwrap_or(false);
    let is_focused = window.is_focused().unwrap_or(false);

    if is_visible && !is_minimized && is_focused {
        let _ = window.minimize();
    } else {
        show_and_focus_window(app);
    }
}

/// Builds and attaches the system tray icon, menu, and its event handlers.
fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let open_item = MenuItem::with_id(app, "open", "Abrir", true, None::<&str>)?;
    let sync_item = MenuItem::with_id(app, "sync", "Sincronizar ahora", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
    let tray_menu = Menu::with_items(app, &[&open_item, &sync_item, &quit_item])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_and_focus_window(app),
            "sync" => {
                if let Ok(updated) = scanner::sync_shortcuts(app.clone()) {
                    let _ = app.emit("shortcuts-synced", updated);
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                button_state: tauri::tray::MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                let is_visible = app
                    .get_webview_window("main")
                    .and_then(|w| w.is_visible().ok())
                    .unwrap_or(false);

                if is_visible {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.hide();
                    }
                } else {
                    show_and_focus_window(app);
                }
            }
        })
        .build(app)?;

    Ok(())
}

/// Registers the auto-minimize-on-blur behavior: when the window loses focus,
/// wait briefly (in case focus bounces back) then minimize it — unless paused.
fn setup_auto_minimize(app_handle: AppHandle, window: &WebviewWindow, paused: Arc<AtomicBool>) {
    let focus_epoch = Arc::new(AtomicU64::new(0));
    let last_focus_time = Arc::new(std::sync::Mutex::new(std::time::Instant::now()));

    window.on_window_event(move |event| match event {
        tauri::WindowEvent::Focused(true) => {
            focus_epoch.fetch_add(1, Ordering::SeqCst);
            *last_focus_time.lock().unwrap() = std::time::Instant::now();
        }
        tauri::WindowEvent::Focused(false) => {
            if paused.load(Ordering::SeqCst) {
                return;
            }

            let elapsed = last_focus_time.lock().unwrap().elapsed();
            if elapsed < std::time::Duration::from_millis(400) {
                return;
            }

            let my_epoch = focus_epoch.fetch_add(1, Ordering::SeqCst) + 1;
            let app_handle = app_handle.clone();
            let focus_epoch = focus_epoch.clone();

            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(200)).await;

                if focus_epoch.load(Ordering::SeqCst) == my_epoch {
                    let _ = app_handle.get_webview_window("main").map(|w| w.minimize());
                }
            });
        }
        _ => {}
    });
}

/// Spawns the background loop that periodically syncs shortcuts,
/// respecting `sync_enabled` and `update_interval` from settings.
fn spawn_sync_loop(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let settings = settings::load_settings(&app_handle);

            if settings.sync_enabled {
                if let Ok(updated) = scanner::sync_shortcuts(app_handle.clone()) {
                    let _ = app_handle.emit("shortcuts-synced", updated);
                }
            }

            let hours = settings.update_interval.max(1);
            tokio::time::sleep(std::time::Duration::from_secs(hours as u64 * 3600)).await;
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
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
            settings::apply_window_position,
            excluded::get_excluded,
            excluded::delete_excluded,
            excluded::restore_excluded,
            excluded::clear_excluded,
            installed_programs::list_installed_programs,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let settings = settings::load_settings(app.handle());
            let _ = settings::apply_window_position(app.handle().clone(), settings.position.clone());

            // Only apply start behavior if auto_start is enabled
            let launched_via_autostart = std::env::args().any(|arg| arg == "--minimized");

            if launched_via_autostart {
                let _ = settings::apply_start_behavior(app.handle(), &settings.start_behavior);
            } else {
                let _ = settings::apply_start_behavior(app.handle(), "normal");
            }

            let auto_minimize_paused = Arc::new(AtomicBool::new(false));
            app.manage(auto_minimize_paused.clone());

            #[cfg(target_os = "windows")]
            {
                use window_vibrancy::apply_acrylic;
                let _ = apply_acrylic(&window, Some((18, 18, 18, 200)));
            }

            spawn_sync_loop(app.handle().clone());
            setup_auto_minimize(app.handle().clone(), &window, auto_minimize_paused);

            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyS);
            app.global_shortcut().register(shortcut)?;

            setup_tray(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}