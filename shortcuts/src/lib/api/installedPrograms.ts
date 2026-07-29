/**
 * Functions to handle scanning for shortcuts in the backend
 */

import { invoke } from "@tauri-apps/api/core";
import { Program } from "@/types";

export function getInstalledPrograms() {
    return invoke<Program[]>("list_installed_programs");
}