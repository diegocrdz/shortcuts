/**
 * Functions to handle categories in the backend
 */

import { invoke } from "@tauri-apps/api/core";
import { Category } from "@/types";

// CRUD functions

export function getCategories() {
    return invoke<Category[]>("get_categories");
}

export async function createCategory(category: Category) {
    return invoke<Category[]>("create_category", { category });
}

export async function updateCategory(category: Category) {
    return invoke<Category[]>("update_category", { category });
}

export async function deleteCategory(id: string) {
    return invoke<Category[]>("delete_category", { id });
}

export async function reorderCategories(categories: Category[]) {
    return invoke<Category[]>("reorder_categories", { categories });
}