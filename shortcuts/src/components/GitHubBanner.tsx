/**
 * GitHub banner component
 */

import { useTranslation } from "react-i18next";

export default function GitHubBanner() {
    const { t } = useTranslation();
    
    return (
        <a href="https://github.com/diegocrdz/shortcuts" target="_blank" className="flex">
            <div className="flex gap-4 items-center bg-primary/60 p-4 rounded-md hover:bg-primary/70 transition-colors">
                <p className="text-xs text-secondary font-semibold">
                    {t("settings.github")}
                </p>
                <img
                    src="github-logo.svg"
                    alt="GitHub Logo"
                    className="h-16 w-16"
                />
            </div>
        </a>
    );
}