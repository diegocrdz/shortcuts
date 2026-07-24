/**
 * Functions to handle scanning for shortcuts in the backend
 */

import { invoke } from "@tauri-apps/api/core";
import { Shortcut } from "@/types";

export async function scanGames(shortcuts: Shortcut[]) {
    const found = await invoke<Shortcut[]>("scan_installed_games");
    const existingIds = new Set(shortcuts.map((s) => s.id));
    const newOnes = found.filter((s) => !existingIds.has(s.id));

    for (const game of newOnes) {
        await invoke<Shortcut[]>("create_shortcut", { shortcut: game });
    }

    return await invoke<Shortcut[]>("get_shortcuts");
}

export async function syncShortcuts() {
    return await invoke<Shortcut[]>("sync_shortcuts");
};