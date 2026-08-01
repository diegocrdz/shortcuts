/**
 * Functions to handle settings in the backend
 */

import { invoke } from "@tauri-apps/api/core";
import { Settings } from "@/types";

// CRUD functions

export async function getSettings() {
    return invoke<Settings>("get_settings");
}

export async function updateSettings(settings: Settings) {
    return invoke<Settings>("update_settings", { settings });
}

export async function resetSettings() {
    return invoke<Settings>("reset_settings");
}

export async function applyWindowPosition(position: string) {
    return invoke("apply_window_position", { position });
}