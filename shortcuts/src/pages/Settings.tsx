/**
 * Settings page 
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { ArrowLeft, Settings2, Rocket, Tag, Info, Folder } from "lucide-react";

import General from "@/components/settings/General";
import Shortcuts from "@/components/settings/Shortcuts";
import Tags from "@/components/settings/Tags";
import Categories from "@/components/settings/Categories";
import About from "@/components/settings/About";

export default function Settings() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("general");
    const navigate = useNavigate();

    const TABS = [
        { id: "general", label: t("settings.tabs.general.title"), icon: <Settings2 /> },
        { id: "shortcuts", label: t("settings.tabs.shortcuts.title"), icon: <Rocket /> },
        { id: "tags", label: t("settings.tabs.tags.title"), icon: <Tag /> },
        { id: "categories", label: t("settings.tabs.categories.title"), icon: <Folder /> },
        { id: "about", label: t("settings.tabs.about.title"), icon: <Info /> },
    ];
    
    return (
        <div className="grid grid-cols-[1fr_8fr] gap-8 h-full overflow-hidden">
            {/* Sidebar */}
            <div className="flex flex-col gap-8 p-8">
                {/* Title */}
                <div className="flex items-center gap-4">
                    <Button onClick={() => navigate("/")} variant="outline" size="icon">
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-md font-semibold">{t("settings.title")}</h1>
                </div>

                {/* Sections */}
                <div className="flex flex-col gap-2">
                    {TABS.map((tab) => (
                        <Button
                            key={tab.id}
                            variant="link"
                            className={`justify-start p-0 gap-4 ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                        </Button>
                    ))}
                </div>

                {/* Version */}
                <div className="flex flex-col gap-2 mt-auto">
                    <p className="text-sm text-muted-foreground">v{t("settings.tabs.about.version.description")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.tabs.about.lastUpdate.description")}</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex bg-background/30 gap-8 overflow-auto">
                {activeTab === "general" ? (
                    <General />
                ) : activeTab === "shortcuts" ? (
                    <Shortcuts />
                ) : activeTab === "tags" ? (
                    <Tags />
                ) : activeTab === "categories" ? (
                    <Categories />
                ) : activeTab === "about" ? (
                    <About />
                ) : null}
            </div>
        </div>
    );
}