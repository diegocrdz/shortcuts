/**
 * About information component
 */

import SettingsPage from "@/components/settings/SettingsPage";
import CoffeeBanner from "@/components/CoffeeBanner";
import { useTranslation } from "react-i18next";

const DataBox = ({ title, description }: { title: string; description: string }) => {
    return (
        <div className="flex flex-col gap-2 p-4 border rounded-md">
            <h3 className="text-md font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
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
                {/* Support Banner */}
                <CoffeeBanner />
                
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

                {/* GitHub banner */}
                <div className="flex flex-col items-center justify-center gap-4 p-8 border rounded-md">
                    <h3 className="text-md font-semibold">{t("settings.tabs.about.github.title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("settings.tabs.about.github.description")}</p>
                    <a
                        href="https://github.com/diegocrdz/shortcuts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        {t("settings.tabs.about.github.button")}
                    </a>
                </div>
            </div>
        </SettingsPage>
    );
}