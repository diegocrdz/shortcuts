/**
 * Dashboard Header component.
 * Includes search bar, category tabs, and tag management.
 */

// React
import { useState, useRef } from "react";
import { TFunction } from "i18next";

// Types
import { Category, Tag } from "@/types";

// Components
import SearchBar from "@/components/SearchBar";
import AddTag from "@/components/tags/AddTag";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AddShortcut } from "@/components/shortcuts/AddShortcut";
import { ProgramsDialog } from "@/components/shortcuts/ProgramsDialog";

// Icons
import { LayoutGrid, Star, ChevronDown } from "lucide-react";

// API
import { reorderCategories } from "@/lib/api/categories";

// DnD Kit
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
} from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableTagBadge from "@/components/tags/SortableTagBadge";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import CategoryManagerDialog from "@/components/categories/CategoryManagerDialog";

interface HeaderProps {
    t: TFunction;
    categories: Category[];
    setCategories: (categories: Category[]) => void;
    tags: Tag[];
    visibleCategories: Category[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    selectedTagIds: Set<string>;
    toggleTag: (tagId: string) => void;
    handleCreateTag: (tag: Tag) => Promise<void>;
    handleUpdateTag: (tag: Tag) => Promise<void>;
    handleDeleteTag: (tagId: string) => Promise<void>;
    handleTagDragEnd: (event: any) => void;
    handleCreateCategory: (category: Category) => Promise<void>;
    handleUpdateCategory: (category: Category) => Promise<void>;
    handleDeleteCategory: (categoryId: string) => Promise<void>;
    MAX_FULL_CATEGORIES: number;
    programsDialogOpen: boolean;
    setProgramsDialogOpen: (open: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export function Header({
    t,
    categories,
    setCategories,
    tags,
    visibleCategories,
    activeTab,
    setActiveTab,
    selectedTagIds,
    toggleTag,
    handleCreateTag,
    handleUpdateTag,
    handleDeleteTag,
    handleTagDragEnd,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    MAX_FULL_CATEGORIES,
    programsDialogOpen,
    setProgramsDialogOpen,
    searchQuery,
    setSearchQuery,
}: HeaderProps) {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [manageOpen, setManageOpen] = useState(false);
    const isCompact = visibleCategories.length > MAX_FULL_CATEGORIES;

    function toggleProgramsDialog() {
        setProgramsDialogOpen(!programsDialogOpen);
    }

    // DnD Kit setup for sortable tags
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );
    
    return (
        <div className="flex flex-col gap-8 pt-8 px-8">
            <div className="flex justify-between items-center gap-4">
                <SearchBar ref={searchInputRef} query={searchQuery} onQueryChange={setSearchQuery} />
                <div className="flex items-center gap-2">
                    <AddShortcut onClick={toggleProgramsDialog} />
                    <ProgramsDialog t={t} isOpen={programsDialogOpen} onClose={() => setProgramsDialogOpen(false)} />
                </div>
            </div>
            
            <div className="space-y-4" >
                {/* Categories - Tabs */}
                <div className="flex justify-between items-center gap-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-primary/10 gap-2 w-full">
                            {[
                                { id: "all", icon: <LayoutGrid className="h-4 w-4 shrink-0" />, label: t("categories.defaultCategories.all") },
                                { id: "favourites", icon: <Star className="h-4 w-4 shrink-0" />, label: t("categories.defaultCategories.favourites") },
                                ...visibleCategories.map((category) => ({
                                    id: category.id,
                                    icon: <CategoryIcon name={category.icon} />,
                                    label: t(`categories.defaultCategories.${category.id}`, category.name),
                                })),
                            ].map(({ id, icon, label }) => (
                                <Tooltip key={id}>
                                    <TooltipTrigger render={<TabsTrigger value={id} className="flex-1" />}>
                                        {icon}
                                        {!isCompact && label}
                                    </TooltipTrigger>
                                    {isCompact && <TooltipContent>{label}</TooltipContent>}
                                </Tooltip>
                            ))}
                        </TabsList>
                    </Tabs>
                    <Button variant="outline" size="icon" onClick={() => setManageOpen(true)}>
                        <ChevronDown />
                    </Button>
                </div>
                
                {/* Menu for managing categories (sorting, creation, editing, etc.) */}
                <CategoryManagerDialog
                    t={t}
                    open={manageOpen}
                    onOpenChange={setManageOpen}
                    categories={categories}
                    onSelect={(category) => {
                        setActiveTab(category.id);
                        setManageOpen(false);
                    }}
                    onReorder={async (newOrder) => {
                        setCategories(newOrder);
                        await reorderCategories(newOrder);
                    }}
                    onCreate={handleCreateCategory}
                    onUpdate={handleUpdateCategory}
                    onDelete={handleDeleteCategory}
                />
                
                {/* Tags */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTagDragEnd}>
                    <SortableContext items={tags.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
                        <div className="flex items-center flex-wrap gap-2 overflow-hidden">
                            {tags.map((tag) => (
                                <SortableTagBadge
                                    key={tag.id}
                                    tag={tag}
                                    selected={selectedTagIds.has(tag.id)}
                                    onClick={() => toggleTag(tag.id)}
                                    onUpdate={handleUpdateTag}
                                    onDelete={handleDeleteTag}
                                />
                            ))}
                            <AddTag onCreate={handleCreateTag} />
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}