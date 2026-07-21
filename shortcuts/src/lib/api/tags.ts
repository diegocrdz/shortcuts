/**
 * Functions to handle tags in the backend
 */

import { invoke } from "@tauri-apps/api/core";
import { Tag } from "@/types";

// CRUD functions

export function getTags() {
    return invoke<Tag[]>("get_tags");
}

export async function createTag(tag: Tag) {
    return await invoke<Tag[]>("create_tag", { tag });
}

export async function updateTag(tag: Tag) {
    return await invoke<Tag[]>("update_tag", { tag });
}

export async function deleteTag(id: string) {
    return await invoke<Tag[]>("delete_tag", { id });
}