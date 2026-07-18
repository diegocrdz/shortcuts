/**
 * Settings page 
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import General from "@/components/settings/General";

export default function Settings() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("general");
    const navigate = useNavigate();

    const TABS = [
        { id: "general", label: t("settings.tabs.general"), icon: <Settings2 /> },
    ];
    
    return (
        <div className="grid grid-cols-[200px_8fr] gap-8 h-full overflow-hidden">
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
                            className={`justify-start gap-4 ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex bg-background/30 gap-8 overflow-auto">
                {activeTab === "general" ? (
                    <General />
                ) : null}
            </div>
        </div>
    );
}