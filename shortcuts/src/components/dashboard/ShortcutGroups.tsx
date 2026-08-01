/**
 * Dashbaord Shortcut Grid component.
 * Displays shortcuts in a grid layout, filtered by search query, selected tags, and active category.
 */

// React
import { TFunction } from "i18next";

// Types
import { Shortcut, Tag, Category } from "@/types";

// Components
import ShortcutGrid from "@/components/shortcuts/ShortcutGrid";
import SelectionBadge from "@/components/utils/SelectionBadge";

// Group shortcuts by category
function groupByCategory(list: Shortcut[], categories: Category[]) {
    const groups: Record<string, Shortcut[]> = {};
    for (const category of categories) groups[category.id] = [];
    groups[""] = []; // For uncategorized shortcuts

    for (const s of list) {
        (groups[s.category] ??= []).push(s);
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0);
}

interface ShortcutGroupsProps {
    t: TFunction;
    visibleShortcuts: Shortcut[];
    selectedShortcuts: Set<string>;
    setSelectedShortcuts: (selected: Set<string>) => void;
    categories: Category[];
    tags: Tag[];
    onSelect: (shortcutId: string) => void;
    onCategoryChange: (categoryId: string) => void;
    handleLaunchShortcut: (shortcutId: Shortcut) => void;
    handleDeleteShortcut: (shortcutId: string) => Promise<void>;
    handleUpdateShortcut: (updatedShortcut: Shortcut) => Promise<void>;
}

export function ShortcutGroups({
    t,
    visibleShortcuts,
    selectedShortcuts,
    setSelectedShortcuts,
    categories,
    tags,
    onSelect,
    onCategoryChange,
    handleLaunchShortcut,
    handleDeleteShortcut,
    handleUpdateShortcut,
}: ShortcutGroupsProps) {

    return (
        <div className="relative flex-1 overflow-y-auto">
            <div className="flex flex-col gap-2 px-8 pb-8">
                {groupByCategory(visibleShortcuts, categories).map(([categoryId, shortcuts]) => {
                    const category = categories.find((c) => c.id === categoryId);
                    const title = category ? t(`categories.defaultCategories.${category.id}`, category.name) : t("categories.defaultCategories.uncategorized");
                    return (
                        <ShortcutGrid
                            key={categoryId}
                            title={title}
                            shortcuts={shortcuts}
                            selectedShortcuts={selectedShortcuts}
                            tags={tags}
                            categories={categories}
                            onSelect={onSelect}
                            onLaunch={handleLaunchShortcut}
                            onRemove={handleDeleteShortcut}
                            onUpdate={handleUpdateShortcut}
                        />
                    );
                })}
            </div>
            {selectedShortcuts.size > 0 && (
                <SelectionBadge
                    t={t}
                    bottom={5}
                    selectedCount={selectedShortcuts.size}
                    categories={categories}
                    onClearSelection={() => setSelectedShortcuts(new Set())}
                    onCategoryChange={onCategoryChange}
                    onDelete={async () => {
                        for (const id of selectedShortcuts) {
                            await handleDeleteShortcut(id);
                        }
                        setSelectedShortcuts(new Set());
                    }}
                />
            )}
        </div>
    );
}