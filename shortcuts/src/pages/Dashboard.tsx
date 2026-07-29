/**
 * Main dashboard page for the application.
 * Displays shortcuts, tags, categories, and provides functionality
 * for searching, filtering, and managing them.
 */

// React
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Tauri
import { getCurrentWindow } from "@tauri-apps/api/window";

// Types
import { Shortcut, Tag, Category } from "@/types";

// Components
import ShortcutGrid from "@/components/shortcuts/ShortcutGrid";
import SearchBar from "@/components/SearchBar";
import AddTag from "@/components/tags/AddTag";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AddShortcut } from "@/components/shortcuts/AddShortcut";
import { ProgramsDialog } from "@/components/shortcuts/ProgramsDialog";
import SelectionBadge from "@/components/utils/SelectionBadge";

// API
import { getTags, createTag, updateTag, deleteTag, reorderTags } from "@/lib/api/tags";
import { getShortcuts, updateShortcut, deleteShortcut, launchShortcut } from "@/lib/api/shortcuts";
import { getCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from "@/lib/api/categories";
import { syncShortcuts } from "@/lib/api/scanner";

// Icons
import { RotateCcw, Settings, LayoutGrid, Star, ChevronDown } from "lucide-react";

// DnD Kit
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
    horizontalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import SortableTagBadge from "@/components/tags/SortableTagBadge";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import CategoryManagerDialog from "@/components/categories/CategoryManagerDialog";

// Group shortcuts by category
function groupByCategory(list: Shortcut[], categories: Category[]) {
    const groups: Record<string, Shortcut[]> = {};
    for (const category of categories) groups[category.id] = [];
    groups[""] = []; // For uncategorized shortcuts

    for (const s of list) {
        (groups[s.category] ??= []).push(s);
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0);
}

export default function Dashboard() {
    const { t } = useTranslation();
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
    const [selectedShortcuts, setSelectedShortcuts] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState<{ name: string; progress: number } | null>(null);
    const [footerMsg, setFooterMsg] = useState<string | null>(null);
    const [programsDialogOpen, setProgramsDialogOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const [manageOpen, setManageOpen] = useState(false);
    const MAX_FULL_CATEGORIES = 4;
    const MAX_VISIBLE_CATEGORIES = 15;
    const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES);
    const isCompact = visibleCategories.length > MAX_FULL_CATEGORIES;

    const visibleShortcuts = shortcuts
        // Filter by active tab
        .filter((s) => activeTab === "all" || (activeTab === "favourites" ? s.is_favorite : s.category === activeTab))
        // Filter by selected tags
        .filter((s) => selectedTagIds.size === 0 || s.tags.some((tagId) => selectedTagIds.has(tagId)))
        // Filter by search query
        .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // Focus search bar when the window is focused
    useEffect(() => {
        const win = getCurrentWindow();
        const unlisten = win.listen("tauri://focus", () => {
            setSearchQuery("");
            searchInputRef.current?.focus();
        });
        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    // Fetch data from the backend
    function fetchData() {
        getShortcuts().then(setShortcuts);
        getTags().then(setTags);
        getCategories().then(setCategories);
    }
    
    // Load initial data on mount
    useEffect(() => {
        fetchData();
    }, [programsDialogOpen]);
    
    // Tag functions

    async function handleCreateTag(tag: Tag) {
        const updatedTags = await createTag(tag);
        setTags(updatedTags);
        showFooterMessage(t("tags.actions.tagCreated"));
    }

    async function handleUpdateTag(tag: Tag) {
        const updatedTags = await updateTag(tag);
        setTags(updatedTags);
        showFooterMessage(t("tags.actions.tagUpdated"));
    }

    async function handleDeleteTag(id: string) {
        const updatedTags = await deleteTag(id);
        setTags(updatedTags);
        showFooterMessage(t("tags.actions.tagDeleted"));
    }

    function toggleTag(id: string) {
        setSelectedTagIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    // Category functions

    async function handleCreateCategory(category: Category) {
        const updatedCategories = await createCategory(category);
        setCategories(updatedCategories);
        showFooterMessage(t("categories.actions.categoryCreated"));
    }

    async function handleUpdateCategory(category: Category) {
        const updatedCategories = await updateCategory(category);
        setCategories(updatedCategories);
        showFooterMessage(t("categories.actions.categoryUpdated"));
    }

    async function handleDeleteCategory(id: string) {
        const updatedCategories = await deleteCategory(id);
        setCategories(updatedCategories);
        showFooterMessage(t("categories.actions.categoryDeleted"));
    }

    async function onCategoryChange(categoryId: string) {
        if (selectedShortcuts.size === 0) return;

        let latest = shortcuts;
        for (const s of shortcuts) {
            if (selectedShortcuts.has(s.id)) {
                latest = await updateShortcut({ ...s, category: categoryId });
            }
        }

        setShortcuts(latest);
        showFooterMessage(t("shortcuts.actions.categoryChanged"));
    }

    // Shortcut functions

    function toggleProgramsDialog() {
        setProgramsDialogOpen((prev) => !prev);
    }

    async function handleUpdateShortcut(shortcut: Shortcut) {
        const updatedShortcuts = await updateShortcut(shortcut);
        if (updatedShortcuts) setShortcuts(updatedShortcuts);
        showFooterMessage(t("shortcuts.actions.shortcutUpdated"));
    }

    async function handleDeleteShortcut(id: string) {
        const updatedShortcuts = await deleteShortcut(id);
        if (updatedShortcuts) setShortcuts(updatedShortcuts);
        showFooterMessage(t("shortcuts.actions.shortcutDeleted"));
    }

    async function handleLaunchShortcut(shortcut: Shortcut) {
        await withProgress(
            t("shortcuts.actions.launching"),
            launchShortcut(shortcut)
        );
        showFooterMessage(t("shortcuts.actions.launching"));
    }

    const onSelect = (shortcutId: string) => {
        setSelectedShortcuts((prevSelected) => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(shortcutId)) {
                newSelected.delete(shortcutId);
            } else {
                newSelected.add(shortcutId);
            }
            return newSelected;
        })
    }

    // Scanner functions

    async function handleScanGames() {
        const updatedShortcuts = await withProgress(
            t("shortcuts.actions.scanning"),
            syncShortcuts()
        );
        setShortcuts(updatedShortcuts);
        getCategories().then(setCategories);
        showFooterMessage(t("shortcuts.actions.scanComplete"));
    }

    // Utility function to show a progress bar during async operations
    async function withProgress<T>(name: string, task: Promise<T>): Promise<T> {
        setLoading({ name, progress: 0 });
        setFooterMsg(name);

        const start = Date.now();
        const estimatedDuration = 3000; // Estimated duration for the progress bar to reach 90%
        const interval = setInterval(() => {
            // Update progress based on elapsed time and estimated duration
            setLoading((prev) => {
                if (!prev) return prev;
                const elapsed = Date.now() - start;
                const target = 90 * (1 - Math.exp(-elapsed / estimatedDuration));
                return { ...prev, progress: target };
            });
        }, 100);

        try {
            const result = await task;
            clearInterval(interval);
            setLoading({ name, progress: 100 });
            await new Promise((resolve) => setTimeout(resolve, 300));
            return result;
        } finally {
            setLoading(null);
        }
    }

    // Display footer message for a few seconds
    function showFooterMessage(msg: string, duration: number = 3000) {
        setFooterMsg(msg);
        setTimeout(() => setFooterMsg(null), duration);
    }

    // DnD Kit setup for sortable tags
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    // Handle tag drag end event to reorder tags
    async function handleTagDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = tags.findIndex((t) => t.id === active.id);
        const newIndex = tags.findIndex((t) => t.id === over.id);
        const newOrder = arrayMove(tags, oldIndex, newIndex);

        setTags(newOrder);
        await reorderTags(newOrder);
    }
    
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
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
            
            {/* Shortcut Grid */}
            <div className="relative flex-1 overflow-y-auto">
                <div className="flex flex-col gap-2 px-8 pb-8">
                    {groupByCategory(visibleShortcuts, categories).map(([categoryId, shortcuts]) => {
                        const category = categories.find((c) => c.id === categoryId);
                        const title = category ? t(`categories.defaultCategories.${category.id}`, category.name) : t("categories.defaultCategories.uncategorized");
                        return (
                            <ShortcutGrid
                                key={categoryId}
                                title={title}
                                shortcuts={shortcuts}
                                selectedShortcuts={selectedShortcuts}
                                tags={tags}
                                categories={categories}
                                onSelect={onSelect}
                                onLaunch={handleLaunchShortcut}
                                onRemove={handleDeleteShortcut}
                                onUpdate={handleUpdateShortcut}
                            />
                        );
                    })}
                </div>
                {selectedShortcuts.size > 0 && (
                    <SelectionBadge
                        t={t}
                        bottom={20}
                        selectedCount={selectedShortcuts.size}
                        categories={categories}
                        onClearSelection={() => setSelectedShortcuts(new Set())}
                        onCategoryChange={onCategoryChange}
                        onDelete={async () => {
                            for (const id of selectedShortcuts) {
                                await handleDeleteShortcut(id);
                            }
                            setSelectedShortcuts(new Set());
                        }}
                    />
                )}
            </div>

            {/* Loading progress bar */}
            {loading && (
                <Progress
                    value={loading.progress}
                />
            )}
            
            {/* Footer */}
            <div className="flex justify-between items-center gap-4 bg-background/30 px-8 py-4">
                <img src="icon.png" alt="Logo" className="h-7 w-7" />
                <div className="text-sm text-muted-foreground">
                    {footerMsg}
                </div>
                <div className="space-x-4">
                    <Tooltip>
                        <TooltipTrigger>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleScanGames}
                            >
                                <RotateCcw />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t("shortcuts.actions.sync")}
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate("/settings")}
                            >
                                <Settings />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t("settings.title")}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}
