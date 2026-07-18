/**
 * Dashboard that displays shortcuts, tags and search functionalities.
 */

// React
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Tauri
import { getCurrentWindow, currentMonitor, LogicalPosition } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

// Types
import { Shortcut } from "@/types";
import { Tag } from "@/types";

// Components
import ShortcutGrid from "@/components/shortcuts/ShortcutGrid";
import SearchBar from "@/components/SearchBar";
import TagBadge from "@/components/tags/TagBadge";
import AddTag from "@/components/tags/AddTag";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Icons
import { RotateCcw, Plus, Settings } from "lucide-react";

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
        .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Load tags and shortcuts from the backend when the component mounts
    useEffect(() => {
        invoke<Shortcut[]>("get_shortcuts").then(setShortcuts);
        invoke<Tag[]>("get_tags").then(setTags);
    }, []);
    
    // Position the window at the bottom center of the screen
    useEffect(() => {
        async function positionWindow() {
            const win = getCurrentWindow();
            const monitor = await currentMonitor();
            if (!monitor) return;
            
            const scale = monitor.scaleFactor;
            const screenW = monitor.size.width / scale;
            const screenH = monitor.size.height / scale;
            
            const winSize = await win.outerSize();
            const winW = winSize.width / scale;
            const winH = winSize.height / scale;
            
            const taskbarHeight = 48;
            const margin = 12;
            
            const x = (screenW - winW) / 2;
            const y = screenH - winH - margin - taskbarHeight;
            
            await win.setPosition(new LogicalPosition(x, y));
            await win.show();
        }
        positionWindow();
    }, []);
    
    // Shortcut functions
    function launchShortcut(shortcut: Shortcut) {
        // Artificial delay for the toast
        const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));

        // Launch the shortcut and show a toast notification
        const launch = Promise.all([invoke("launch_shortcut", { shortcut }), minDelay])
            .then(([result]) => result);

        toast.promise(launch, {
            loading: `${t("shortcuts.actions.launching")} ${shortcut.name}...`,
            success: `${t("shortcuts.actions.launched")} ${shortcut.name}.`,
            error: `${t("shortcuts.actions.launch_failed")} ${shortcut.name}.`,
        });
    }
    async function createShortcut() {
        const selected = await open({
            multiple: false,
            filters: [{ name: "Ejecutable", extensions: ["exe"] }],
        });
        if (typeof selected !== "string") return;
        
        const fallbackName = selected.split("\\").pop()?.replace(/\.exe$/i, "") ?? selected;
        const friendlyName = await invoke<string | null>("get_exe_friendly_name", { exePath: selected });
        const name = friendlyName ?? fallbackName;
        
        const newShortcut: Shortcut = {
            id: crypto.randomUUID(),
            name,
            target: selected,
            args: null,
            source: "manual",
            is_favorite: false,
            tags: [],
            icon_path: null,
            category: "others"
        };
        
        const updated = await invoke<Shortcut[]>("create_shortcut", { shortcut: newShortcut });
        setShortcuts(updated);
    }
    async function updateShortcut(shortcut: Shortcut) {
        const updated = await invoke<Shortcut[]>("update_shortcut", { shortcut });
        setShortcuts(updated);
    }
    async function deleteShortcut(id: string) {
        const updated = await invoke<Shortcut[]>("delete_shortcut", { id });
        setShortcuts(updated);
    }
    
    // Tag functions
    function toggleTag(id: string) {
        setSelectedTagIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }
    async function createTag(tag: Tag) {
        setTags(await invoke<Tag[]>("create_tag", { tag }));
    }
    async function updateTag(tag: Tag) {
        setTags(await invoke<Tag[]>("update_tag", { tag }));
    }
    async function deleteTag(id: string) {
        setTags(await invoke<Tag[]>("delete_tag", { id }));
    }

    // Scan games
    async function handleScanGames() {
        const found = await invoke<Shortcut[]>("scan_installed_games");
        const existingIds = new Set(shortcuts.map((s) => s.id));
        const newOnes = found.filter((s) => !existingIds.has(s.id));

        for (const game of newOnes) {
            await invoke<Shortcut[]>("create_shortcut", { shortcut: game });
        }

        const refreshed = await invoke<Shortcut[]>("get_shortcuts");
        setShortcuts(refreshed);
    }
    
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col gap-8 p-8">
                <div className="flex justify-between items-center gap-2">
                    <SearchBar query={searchQuery} onQueryChange={setSearchQuery} />
                    <Button onClick={createShortcut} variant="outline" size="icon">
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
                                onUpdate={updateTag}
                                onDelete={deleteTag}
                            />
                        ))}
                        <AddTag onCreate={createTag} />
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
                            onLaunch={launchShortcut}
                            onRemove={deleteShortcut}
                            onUpdate={updateShortcut}
                        />
                    ))}
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-center gap-4 bg-background/30 px-8 py-4">
                <img src="icon.png" alt="Logo" className="h-7 w-7" />
                <div className="space-x-4">
                    <Button onClick={handleScanGames} variant="outline" size="icon">
                        <RotateCcw />
                    </Button>
                    <Button onClick={() => navigate("/settings")} variant="outline" size="icon">
                        <Settings />
                    </Button>
                </div>
            </div>
        </div>
    );
}
