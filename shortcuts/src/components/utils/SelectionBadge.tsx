/**
 * Selection badge that dispays the number of selected items and allows
 * performing actions on them (e.g., delete, favorite, etc.)
 */

import { TFunction } from "i18next";
import { Category } from "@/types";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { Button } from "@/components/ui/button";
import { X, Folder, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type SelectionBadgeProps = {
    t: TFunction;
    selectedCount: number;
    categories?: Category[];
    bottom?: number;
    onClearSelection?: () => void;
    onCategoryChange?: (categoryId: string) => void;
    onAddShortcut?: () => void;
    onDelete?: () => void;
};

export default function SelectionBadge({
    t,
    selectedCount,
    categories = [],
    bottom = 0,
    onClearSelection,
    onCategoryChange,
    onAddShortcut,
    onDelete,
}: SelectionBadgeProps) {
    return (
        <div
            className="fixed right-8 z-50 flex items-center gap-2 rounded-md bg-primary p-1"
            style={{ bottom: `${bottom}rem` }}
        >
            {/* Close button */}
            <Button
                size="icon"
                onClick={onClearSelection}
            >
                <X />
            </Button>

            {/* Selected count */}
            <span className="text-secondary text-sm font-medium">
                {selectedCount} {t("shortcuts.actions.selected")}
            </span>

            {/* Add shortcut button */}
            {onAddShortcut && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onAddShortcut}
                >
                    {t("shortcuts.actions.addAction")}
                </Button>
            )}

            {/* Category button */}
            {onCategoryChange && (
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Folder />
                            {t("shortcuts.category")}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {categories.length > 0 ? (
                            categories.map((category) => (
                                <DropdownMenuItem key={category.id} onClick={() => onCategoryChange?.(category.id)}>
                                    <CategoryIcon name={category.icon} />
                                    {category.name}
                                </DropdownMenuItem>
                            ))
                        ) : (
                            <DropdownMenuItem disabled>
                                {t("categories.noCategories")}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Delete button */}
            {onDelete && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                >
                    <Trash />
                    {t("actions.delete")}
                </Button>
            )}
        </div>
    );
}