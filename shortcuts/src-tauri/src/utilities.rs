/**
 * Utility functions
 */

use std::sync::{Arc, atomic::{AtomicBool, Ordering}};

#[tauri::command]
pub fn set_auto_minimize_paused(paused: bool, state: tauri::State<'_, Arc<AtomicBool>>) {
    state.store(paused, Ordering::SeqCst);
}