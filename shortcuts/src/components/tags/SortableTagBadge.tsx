/**
 * Wrapper component for TagBadge that makes it sortable using @dnd-kit/sortable.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TagBadge from "./TagBadge";
import { Tag } from "@/types";

interface Props {
    tag: Tag;
    selected: boolean;
    onClick: () => void;
    onUpdate: (tag: Tag) => void;
    onDelete: (id: string) => void;
}

export default function SortableTagBadge({ tag, ...props }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: tag.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TagBadge tag={tag} {...props} />
        </div>
    );
}