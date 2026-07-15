/**
 * Individual shortcut tile component that displays the shortcut's name and icon.
 */

import { Shortcut } from "@/types";
import { Tag } from "@/types";
import { Badge } from "@/components/ui/badge";
import { convertFileSrc } from "@tauri-apps/api/core";
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
    tags: Tag[];
    onLaunch: (shortcut: Shortcut) => void;
    onRemove: (id: string) => void;
    onUpdate: (shortcut: Shortcut) => void;
}

export default function ShortcutTile({
    shortcut,
    tags,
    onLaunch,
    onRemove,
    onUpdate
}: Props) {
    // Get icon source path
    // If icon_path is null, use a default icon
    const iconSrc = shortcut.icon_path ? convertFileSrc(shortcut.icon_path) : null;

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    onClick={() => onLaunch(shortcut)}
                    className="
                        flex flex-col items-center justify-start gap-2
                        h-22 cursor-pointer bg-transparent hover:bg-primary/10 rounded-md p-2
                        transition-colors duration-200 ease-in-out
                    "
                >
                    {/* Icon */}
                    <div className="relative">
                        {iconSrc ? (
                            <img src={iconSrc} alt={shortcut.name} className="max-h-full max-w-full" />
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

            <ContextMenuContent>
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
                        Abrir
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onUpdate({ ...shortcut, is_favorite: !shortcut.is_favorite })}>
                        {shortcut.is_favorite ? <Star className="fill-yellow-400 text-yellow-400" /> : <Star />}
                        Favorito
                    </ContextMenuItem>
                </ContextMenuGroup>
                
                {/* Tag submenu */}
                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        <TagIcon />
                        Etiquetas
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
                                No hay etiquetas
                            </ContextMenuItem>
                        )}
                    </ContextMenuSubContent>
                </ContextMenuSub>

                {/* Category submenu */}
                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        <Folder />
                        Mover
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                        <ContextMenuRadioGroup
                            value={shortcut.category}
                            onValueChange={(category) => onUpdate({ ...shortcut, category: category as Shortcut["category"] })}
                        >
                            <ContextMenuRadioItem value="launchers">Launchers</ContextMenuRadioItem>
                            <ContextMenuRadioItem value="games">Juegos</ContextMenuRadioItem>
                            <ContextMenuRadioItem value="others">Otros</ContextMenuRadioItem>
                        </ContextMenuRadioGroup>
                    </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSeparator />

                <ContextMenuGroup>
                    <ContextMenuItem variant="destructive" onClick={() => onRemove(shortcut.id)}>
                        <Trash />
                        Eliminar
                    </ContextMenuItem>
                </ContextMenuGroup>
            </ContextMenuContent>
        </ContextMenu>
    );
}