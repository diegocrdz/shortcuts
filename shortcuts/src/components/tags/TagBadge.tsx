/**
 * TagBadge component that displays a tag with its name and color.
 * It also provides a context menu for editing and deleting the tag.
 */

import { Tag } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent } from "@/components/ui/context-menu";
import TagMenu from "./TagMenu";

interface Props {
  tag: Tag;
  selected?: boolean;
  onClick?: () => void;
  onUpdate: (tag: Tag) => void;
  onDelete: (id: string) => void;
}

export default function TagBadge({ tag, selected, onClick, onUpdate, onDelete }: Props) {
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Badge
                    style={{
                        borderColor: tag.color,
                        backgroundColor: selected ? `${tag.color}60` : `${tag.color}10`,
                    }}
                    className="flex h-full cursor-pointer items-center border transition-all text-primary font-semibold"
                    onClick={onClick}
                >
                    {tag.name}
                </Badge>
            </ContextMenuTrigger>
            <ContextMenuContent className="p-3">
                <TagMenu
                    mode="edit"
                    name={tag.name}
                    color={tag.color}
                    onNameChange={(name) => onUpdate({ ...tag, name })}
                    onColorChange={(color) => onUpdate({ ...tag, color })}
                    onSubmit={() => {}}
                    onDelete={() => onDelete(tag.id)}
                />
            </ContextMenuContent>
        </ContextMenu>
    );
}