/**
 * Main dashboard page for the application.
 * Displays shortcuts, tags, categories, and provides functionality
 * for searching, filtering, and managing them.
 */

// React
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

// Tauri
import { getCurrentWindow } from "@tauri-apps/api/window";

// Types
import { Shortcut, Tag, Category } from "@/types";

// Components
import { Header } from "@/components/dashboard/Header";
import { ShortcutGroups } from "@/components/dashboard/ShortcutGroups";
import { Progress } from "@/components/ui/progress";
import { Footer } from "@/components/dashboard/Footer";

// API
import { getTags, createTag, updateTag, deleteTag, reorderTags } from "@/lib/api/tags";
import { getShortcuts, updateShortcut, deleteShortcut, launchShortcut } from "@/lib/api/shortcuts";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/categories";
import { syncShortcuts } from "@/lib/api/scanner";

// DnD Kit
import {
    DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

// Constants
const MAX_FULL_CATEGORIES = 4;
const MAX_VISIBLE_CATEGORIES = 15;

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
    const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES);

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
            <Header
                t={t}
                categories={categories}
                setCategories={setCategories}
                tags={tags}
                visibleCategories={visibleCategories}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                selectedTagIds={selectedTagIds}
                toggleTag={toggleTag}
                handleCreateTag={handleCreateTag}
                handleUpdateTag={handleUpdateTag}
                handleDeleteTag={handleDeleteTag}
                handleTagDragEnd={handleTagDragEnd}
                handleCreateCategory={handleCreateCategory}
                handleUpdateCategory={handleUpdateCategory}
                handleDeleteCategory={handleDeleteCategory}
                MAX_FULL_CATEGORIES={MAX_FULL_CATEGORIES}
                programsDialogOpen={programsDialogOpen}
                setProgramsDialogOpen={setProgramsDialogOpen}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />
            
            {/* Shortcut Groups */}
            <ShortcutGroups
                t={t}
                visibleShortcuts={visibleShortcuts}
                selectedShortcuts={selectedShortcuts}
                setSelectedShortcuts={setSelectedShortcuts}
                categories={categories}
                tags={tags}
                onSelect={onSelect}
                onCategoryChange={onCategoryChange}
                handleLaunchShortcut={handleLaunchShortcut}
                handleDeleteShortcut={handleDeleteShortcut}
                handleUpdateShortcut={handleUpdateShortcut}
            />

            {/* Loading progress bar */}
            {loading && (
                <Progress
                    value={loading.progress}
                />
            )}
            
            {/* Footer */}
            <Footer
                t={t}
                footerMsg={footerMsg ?? ""}
                handleScanGames={handleScanGames}
            />
        </div>
    );
}
