/**
 * Shortcuts config component
 */

import SettingsPage from "@/components/settings/SettingsPage";
import { useTranslation } from "react-i18next";

export default function ExcludedShortcuts() {
    const { t } = useTranslation();

    return (
        <SettingsPage
            name={t("settings.tabs.shortcuts.title")}
            description={t("settings.tabs.shortcuts.description")}
        >
            <div className="flex flex-col gap-8">
                {/* Content for managing excluded shortcuts */}
            </div>
        </SettingsPage>
    );
}