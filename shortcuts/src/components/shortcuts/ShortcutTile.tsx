/**
 * Individual shortcut tile component that displays the shortcut's name and icon.
 */

import { Shortcut, Tag, Category } from "@/types";
import { Badge } from "@/components/ui/badge";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ContextMenu,
    ContextMenuLabel,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuGroup,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuCheckboxItem,
    ContextMenuRadioGroup,
    ContextMenuRadioItem
} from "@/components/ui/context-menu"
import {
    Gamepad2,
    ExternalLink,
    Star,
    Tag as TagIcon,
    Trash,
    Folder,
    File,
    Rocket,
} from "lucide-react";

interface Props {
    shortcut: Shortcut;
    selected: boolean;
    tags: Tag[];
    categories: Category[];
    onSelect: (shortcutId: string) => void;
    onClearSelection?: () => void;
    onLaunch: (shortcut: Shortcut) => void;
    onRemove: (id: string) => void;
    onUpdate: (shortcut: Shortcut) => void;
}

export default function ShortcutTile({
    shortcut,
    selected,
    tags,
    categories,
    onSelect,
    onLaunch,
    onRemove,
    onUpdate
}: Props) {
    const { t } = useTranslation();

    // Get icon source path
    // If icon_path is null, use a default icon
    const iconSrc = shortcut.icon_path ? convertFileSrc(shortcut.icon_path) : null;

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    onClick={() => selected ? onSelect(shortcut.id) : onLaunch(shortcut)}
                    className={`
                        group relative flex flex-col items-center justify-start gap-2
                        h-22 cursor-pointer hover:bg-primary/10 rounded-md p-2 border
                        ${selected ? "bg-primary/10 border-border" : "border-transparent"}
                    `}
                >
                    {/* Selection Checkbox */}
                    <div
                        className={`absolute top-1 left-1 z-20 transition-opacity
                            ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                        `}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Checkbox
                            checked={selected}
                            onCheckedChange={() => onSelect(shortcut.id)}
                        />
                    </div>

                    {/* Icon */}
                    <div className="relative">
                        {/* Image */}
                        {iconSrc ? (
                            <img src={iconSrc} alt={shortcut.name} className="h-8 w-8" />
                        ) : shortcut.category === "launchers" ? (
                            <Rocket size={32} className="text-muted-foreground" />
                        ) : shortcut.category === "games" ? (
                            <Gamepad2 size={32} className="text-muted-foreground" />
                        ) : (
                            <File size={32} className="text-muted-foreground" />
                        )}

                        {/* Favorite Star */}
                        {shortcut.is_favorite && (
                            <Star size={16} className="size-3 absolute -top-1 -right-2 fill-yellow-400 text-yellow-400" />
                        )}
                    </div>

                    {/* Name */}
                    <p className="text-xs text-center line-clamp-2 w-full wrap-break-word">
                        {shortcut.name}
                    </p>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-32">
                <ContextMenuGroup>
                    <ContextMenuLabel>
                        {shortcut.name}
                    </ContextMenuLabel>
                </ContextMenuGroup>

                {/* Display tags if the shortcut has any */}
                {shortcut.tags.length > 0 ? (
                    <>
                        <ContextMenuGroup>
                            {tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap p-1">
                                    {tags.map((tag) => (
                                        shortcut.tags.includes(tag.id) && (
                                            <Badge
                                                key={tag.id}
                                                variant="outline"
                                                style={{ borderColor: tag.color, color: tag.color }}
                                                className="select-none"
                                            >
                                                {tag.name}
                                            </Badge>
                                        )
                                    ))}
                                </div>
                            )}
                        </ContextMenuGroup>
                        <ContextMenuSeparator />
                    </>
                ) : (null)}

                <ContextMenuGroup>
                    <ContextMenuItem onClick={() => onLaunch(shortcut)}>
                        <ExternalLink />
                        {t("shortcuts.open")}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onUpdate({ ...shortcut, is_favorite: !shortcut.is_favorite })}>
                        {shortcut.is_favorite ? <Star className="fill-yellow-400 text-yellow-400" /> : <Star />}
                        {t("shortcuts.favorite")}
                    </ContextMenuItem>
                </ContextMenuGroup>
                
                {/* Tag submenu */}
                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        <TagIcon />
                        {t("shortcuts.tags")}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                        {tags.length > 0 ? (
                            tags.map((tag) => (
                                <ContextMenuCheckboxItem
                                    key={tag.id}
                                    checked={shortcut.tags.includes(tag.id)}
                                    onCheckedChange={() => {
                                        if (shortcut.tags.includes(tag.id)) {
                                            onUpdate({ ...shortcut, tags: shortcut.tags.filter(t => t !== tag.id) });
                                        } else {
                                            onUpdate({ ...shortcut, tags: [...shortcut.tags, tag.id] });
                                        }
                                    }}
                                >
                                    <Badge
                                        variant="outline"
                                        style={{ borderColor: tag.color, color: tag.color }}
                                        className="cursor-pointer"
                                    >
                                        {tag.name}
                                    </Badge>
                                </ContextMenuCheckboxItem>
                            ))
                        ) : (
                            <ContextMenuItem disabled>
                                {t("shortcuts.noTags")}
                            </ContextMenuItem>
                        )}
                    </ContextMenuSubContent>
                </ContextMenuSub>

                {/* Category submenu */}
                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        <Folder />
                        {t("shortcuts.category")}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                        <ContextMenuRadioGroup
                            value={shortcut.category}
                            onValueChange={(value) => onUpdate({ ...shortcut, category: value })}
                        >
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <ContextMenuRadioItem key={category.id} value={category.id}>
                                        {category.name}
                                    </ContextMenuRadioItem>
                                ))
                            ) : (
                                <ContextMenuItem disabled>
                                    {t("categories.noCategories")}
                                </ContextMenuItem>
                            )}
                        </ContextMenuRadioGroup>
                    </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSeparator />

                <ContextMenuGroup>
                    <ContextMenuItem variant="destructive" onClick={() => onRemove(shortcut.id)}>
                        <Trash />
                        {t("shortcuts.delete")}
                    </ContextMenuItem>
                </ContextMenuGroup>
            </ContextMenuContent>
        </ContextMenu>
    );
}