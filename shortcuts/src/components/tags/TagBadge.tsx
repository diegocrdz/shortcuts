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
                    variant={selected ? "default" : "outline"}
                    style={{ borderColor: tag.color, backgroundColor: selected ? tag.color : "transparent", color: selected ? "white" : tag.color }}
                    className="cursor-pointer"
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