/**
 * About information component
 */

import SettingsPage from "@/components/settings/SettingsLayout";
import CoffeeBanner from "@/components/CoffeeBanner";
import GitHubBanner from "@/components/GitHubBanner";
import { useTranslation } from "react-i18next";

const DataBox = ({ title, description }: { title: string; description: string }) => {
    return (
        <div className="flex flex-col gap-2 p-4 border rounded-md">
            <h3 className="text-md font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

const LauncherBox = ({ title, imgSrc }: { title: string; imgSrc: string }) => {
    return (
        <div className="flex items-center gap-2">
            <img src={imgSrc} alt={title} className="w-8 h-8" />
            <h3 className="text-md font-semibold">{title}</h3>
        </div>
    );
}

export default function ExcludedShortcuts() {
    const { t } = useTranslation();

    return (
        <SettingsPage
            name={t("settings.tabs.about.title")}
            description={t("settings.tabs.about.description")}
        >
            <div className="flex flex-col gap-8">
                {/* Support banners */}
                <div className="grid grid-cols-2 gap-4">
                    <CoffeeBanner />
                    <GitHubBanner />
                </div>
                
                {/* General info */}
                <div className="grid grid-cols-3 gap-4">
                    <DataBox
                        title={t("settings.tabs.about.version.title")}
                        description={t("settings.tabs.about.version.description")}
                    />
                    <DataBox
                        title={t("settings.tabs.about.lastUpdate.title")}
                        description={t("settings.tabs.about.lastUpdate.description")}
                    />
                    <DataBox
                        title={t("settings.tabs.about.license.title")}
                        description={t("settings.tabs.about.license.description")}
                    />
                </div>

                {/* Supported launchers */}
                <div className="flex flex-col gap-4 p-8 border rounded-md">
                    <h3 className="text-md font-semibold">{t("settings.tabs.about.launchers.title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("settings.tabs.about.launchers.description")}</p>
                    <div className="flex flex-col gap-4 mt-4">
                        <LauncherBox
                            title={t("settings.tabs.about.launchers.list.steam")}
                            imgSrc="supported-launchers/steam.svg"
                        />
                        <LauncherBox
                            title={t("settings.tabs.about.launchers.list.epicGames")}
                            imgSrc="supported-launchers/epic-games.svg"
                        />
                        <LauncherBox
                            title={t("settings.tabs.about.launchers.list.riotClient")}
                            imgSrc="supported-launchers/riot-client.svg"
                        />
                    </div>
                </div>
            </div>
        </SettingsPage>
    );
}