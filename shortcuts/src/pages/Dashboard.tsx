/**
 * Dashboard that displays shortcuts, tags and search functionalities.
 */

// React
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Tauri
import { getCurrentWindow } from "@tauri-apps/api/window";

// Types
import { Shortcut } from "@/types";
import { Tag } from "@/types";

// Components
import ShortcutGrid from "@/components/shortcuts/ShortcutGrid";
import SearchBar from "@/components/SearchBar";
import TagBadge from "@/components/tags/TagBadge";
import AddTag from "@/components/tags/AddTag";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// API
import { getTags, createTag, updateTag, deleteTag } from "@/lib/api/tags";
import { getShortcuts, createShortcut, updateShortcut, deleteShortcut, launchShortcut } from "@/lib/api/shortcuts";
import { scanGames } from "@/lib/api/scanner";

// Icons
import { RotateCcw, Plus, Settings } from "lucide-react";

// Group shortcuts by category
function groupByCategory(list: Shortcut[]): [Shortcut["category"], Shortcut[]][] {
    const groups: Record<string, Shortcut[]> = { launchers: [], games: [], others: [] };
    for (const s of list) {
        groups[s.category]?.push(s);
    }
    return (Object.entries(groups) as [Shortcut["category"], Shortcut[]][])
        .filter(([, items]) => items.length > 0);
}

export default function Dashboard() {
    const { t } = useTranslation();
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState<{ name: string; progress: number } | null>(null);
    const [footerMsg, setFooterMsg] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const CATEGORY_LABELS: Record<Shortcut["category"], string> = {
        launchers: t("shortcuts.categories.launchers"),
        games: t("shortcuts.categories.games"),
        others: t("shortcuts.categories.others"),
    };

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
    }
    
    // Load initial data on mount
    useEffect(() => {
        fetchData();
    }, []);
    
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

    // Shortcut functions

    async function handleCreateShortcut() {
        const updatedShortcuts = await createShortcut();
        if (updatedShortcuts) setShortcuts(updatedShortcuts);
        showFooterMessage(t("shortcuts.actions.shortcutCreated"));
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

    // Scanner functions

    async function handleScanGames() {
        const updatedShortcuts = await withProgress(
            t("shortcuts.actions.scanning"),
            scanGames(shortcuts)
        );
        setShortcuts(updatedShortcuts);
        showFooterMessage(t("shortcuts.actions.scanComplete"));
    }

    // Launch shortcut function
    async function handleLaunchShortcut(shortcut: Shortcut) {
        await withProgress(
            t("shortcuts.actions.launching"),
            launchShortcut(shortcut)
        );
        showFooterMessage(t("shortcuts.actions.launching"));
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
    
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col gap-8 p-8">
                <div className="flex justify-between items-center gap-4">
                    <SearchBar ref={searchInputRef} query={searchQuery} onQueryChange={setSearchQuery} />
                    <Button onClick={handleCreateShortcut} variant="outline" size="icon">
                        <Plus />
                    </Button>
                </div>
                
                <div className="space-y-4" >
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="w-full bg-primary/10">
                            <TabsTrigger value="all">{t("shortcuts.categories.all")}</TabsTrigger>
                            <TabsTrigger value="favourites">{t("shortcuts.categories.favourites")}</TabsTrigger>
                            <TabsTrigger value="launchers">{t("shortcuts.categories.launchers")}</TabsTrigger>
                            <TabsTrigger value="games">{t("shortcuts.categories.games")}</TabsTrigger>
                            <TabsTrigger value="others">{t("shortcuts.categories.others")}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {/* Tags */}
                    <div className="flex gap-2">
                        {tags.map((tag) => (
                            <TagBadge
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
                </div>
            </div>
            
            {/* Shortcut Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-6 px-8 pb-8">
                    {groupByCategory(visibleShortcuts).map(([category, items]) => (
                        <ShortcutGrid
                            key={category}
                            title={CATEGORY_LABELS[category]}
                            shortcuts={items}
                            tags={tags}
                            onLaunch={handleLaunchShortcut}
                            onUpdate={handleUpdateShortcut}
                            onRemove={handleDeleteShortcut}
                        />
                    ))}
                </div>
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
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleScanGames}
                    >
                        <RotateCcw />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/settings")}
                    >
                        <Settings />
                    </Button>
                </div>
            </div>
        </div>
    );
}
