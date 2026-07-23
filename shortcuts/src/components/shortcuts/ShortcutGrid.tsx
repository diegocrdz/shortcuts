/**
* ShortcutGrid component that displays a grid of shortcuts.
* It receives an array of shortcuts and renders a ShortcutTile for each one.
*/

import { Shortcut, Tag, Category } from "@/types";
import ShortcutTile from "@/components/shortcuts/ShortcutTile";

type ShortcutGridProps = {
    title?: string;
    shortcuts: Shortcut[];
    selectedShortcuts?: Set<string>;
    categories: Category[];
    tags: Tag[];
    onSelect: (shortcutId: string) => void;
    onLaunch: (shortcut: Shortcut) => void;
    onRemove: (id: string) => void;
    onUpdate: (shortcut: Shortcut) => void;
};

export default function ShortcutGrid({
    title,
    shortcuts,
    selectedShortcuts,
    tags,
    categories,
    onSelect,
    onLaunch,
    onRemove,
    onUpdate
}: ShortcutGridProps) {
    // Sort shortcuts by favorite status and then by name
    shortcuts.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex flex-col gap-2">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            <div className="grid grid-cols-8 gap-1">
                {shortcuts.map((s) => (
                    <ShortcutTile
                        key={s.id}
                        shortcut={s}
                        selected={selectedShortcuts?.has(s.id) ?? false}
                        tags={tags}
                        categories={categories}
                        onSelect={onSelect}
                        onLaunch={onLaunch}
                        onRemove={onRemove}
                        onUpdate={onUpdate}
                    />
                ))}
            </div>
        </div>
    );
}