/**
 * Functions to handle shortcuts in the backend
 */

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Shortcut } from "@/types";

/**
 * Sets the auto-minimize paused state in the backend.
 * This is used to prevent the application from minimizing automatically
 * @param {boolean} paused Whether to pause auto-minimize or not
 */
function setAutoMinimizePaused(paused: boolean) {
    return invoke("set_auto_minimize_paused", { paused });
}

// CRUD functions

export function getShortcuts() {
    return invoke<Shortcut[]>("get_shortcuts");
}

export async function createShortcut() {
    await setAutoMinimizePaused(true);

    try {
        // Open a file dialog to select an executable
        const selected = await open({
            multiple: false,
            filters: [{ name: "Ejecutable", extensions: ["exe"] }],
        });

        if (typeof selected !== "string") return;

        // Extract a friendly name for the shortcut
        const fallbackName = selected.split("\\").pop()?.replace(/\.exe$/i, "") ?? selected;
        const friendlyName = await invoke<string | null>("get_exe_friendly_name", { exePath: selected });
        const name = friendlyName ?? fallbackName;

        // Create a new shortcut object
        const newShortcut: Shortcut = {
            id: crypto.randomUUID(),
            name,
            target: selected,
            args: null,
            source: "manual",
            is_favorite: false,
            tags: [],
            icon_path: null,
            category: "others"
        };

        const updated = await invoke<Shortcut[]>("create_shortcut", { shortcut: newShortcut });
        return updated;
    } finally {
        await setAutoMinimizePaused(false);
    }
}

export async function updateShortcut(shortcut: Shortcut) {
    return await invoke<Shortcut[]>("update_shortcut", { shortcut });
}

export async function deleteShortcut(id: string) {
    return await invoke<Shortcut[]>("delete_shortcut", { id });
}

// Excluded shortcuts functions

export async function getExcludedShortcuts() {
    return await invoke<Shortcut[]>("get_excluded");
}

export async function deleteExcludedShortcut(id: string) {
    return await invoke<Shortcut[]>("delete_excluded", { id });
}

export async function restoreExcludedShortcut(id: string) {
    return await invoke<Shortcut[]>("restore_excluded", { id });
}

// Additional utility functions

export function launchShortcut(shortcut: Shortcut) {
    return invoke("launch_shortcut", { shortcut });
}