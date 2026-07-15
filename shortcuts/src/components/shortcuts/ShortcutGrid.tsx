/**
* ShortcutGrid component that displays a grid of shortcuts.
* It receives an array of shortcuts and renders a ShortcutTile for each one.
*/

import { Shortcut } from "@/types";
import { Tag } from "@/types";
import ShortcutTile from "@/components/shortcuts/ShortcutTile";

type ShortcutGridProps = {
    title?: string;
    shortcuts: Shortcut[];
    tags: Tag[];
    onLaunch: (shortcut: Shortcut) => void;
    onRemove: (id: string) => void;
    onUpdate: (shortcut: Shortcut) => void;
};

export default function ShortcutGrid({
    title,
    shortcuts,
    tags,
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
            <div className="grid grid-cols-8">
                {shortcuts.map((s) => (
                    <ShortcutTile key={s.id} shortcut={s} tags={tags} onLaunch={onLaunch} onRemove={onRemove} onUpdate={onUpdate} />
                ))}
            </div>
        </div>
    );
}