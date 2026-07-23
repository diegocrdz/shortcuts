/**
 * Category Manager Dialog component for managing categories in a dialog.
 * It allows users to create, update, delete, and reorder categories.
 */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import CategoryManagerRow from "./CategoryManagerRow";
import AddCategory from "./AddCategory";
import { Category } from "@/types";
import { TFunction } from "i18next";

interface Props {
    t: TFunction;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    onSelect: (category: Category) => void;
    onReorder: (categories: Category[]) => void;
    onCreate: (category: Category) => void;
    onUpdate: (category: Category) => void;
    onDelete: (id: string) => void;
}

/**
 * Display a dialog for managing categories.
 */
export default function CategoryManagerDialog({
    t,
    open,
    onOpenChange,
    categories,
    onSelect,
    onReorder,
    onCreate,
    onUpdate,
    onDelete,
}: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = categories.findIndex((c) => c.id === active.id);
        const newIndex = categories.findIndex((c) => c.id === over.id);
        onReorder(arrayMove(categories, oldIndex, newIndex));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[80vh] flex flex-col">
                {/* Header */}
                <DialogHeader>
                    <DialogTitle>{t("categories.manage.title")}</DialogTitle>
                </DialogHeader>
                
                {/* Actions */}
                <div className="flex justify-between items-center border-b pb-3">
                    <p className="text-sm text-muted-foreground">
                        {categories.length} {t("categories.manage.count", { count: categories.length })}
                    </p>
                    <AddCategory onCreate={onCreate} />
                </div>
                
                {/* Category List */}
                <div className="flex-1 overflow-y-auto -mx-2 px-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-1">
                                {categories.map((category) => (
                                    <CategoryManagerRow
                                        key={category.id}
                                        t={t}
                                        category={category}
                                        onSelect={onSelect}
                                        onUpdate={onUpdate}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </DialogContent>
        </Dialog>
    );
}