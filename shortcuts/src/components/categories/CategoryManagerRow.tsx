/**
 * Row of each category in the category manager
 * with drag-and-drop support and buttons for editing and deleting.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ExternalLink } from "lucide-react";
import { Category } from "@/types";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { Button } from "@/components/ui/button";
import { TFunction } from "i18next";
import EditCategory from "./EditCatgory";

interface Props {
    t: TFunction;
    category: Category;
    onSelect: (category: Category) => void;
    onUpdate: (updatedCategory: Category) => void;
    onDelete: (id: string) => void;
}

export default function CategoryManagerRow({
    t,
    category,
    onSelect,
    onUpdate,
    onDelete
}: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: category.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
        >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing" />

            {/* Category icon and name */}
            <CategoryIcon name={category.icon} />
            <span className="flex-1 text-sm">
                {t(`categories.defaultCategories.${category.id}`, category.name)}
            </span>

            {/* Action buttons */}
            <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(category);
                }}
            >
                <ExternalLink />
            </Button>
            <EditCategory
                category={category}
                onUpdate={(updatedCategory) => onUpdate(updatedCategory)}
            />
            {category.deletable && (
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(category.id);
                    }}
                >
                    <Trash2 />
                </Button>
            )}
        </div>
    );
}