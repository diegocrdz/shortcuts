/**
 * Buy Me A Coffee banner component
 */

import { useTranslation } from "react-i18next";

export default function CoffeeBanner() {
    const { t } = useTranslation();
    
    return (
        <a href="https://buymeacoffee.com/diego_cordova" target="_blank">
            <div className="flex gap-4 items-center bg-yellow-300/40 p-4 rounded-md">
                <p className="font-semibold text-sm">
                    {t("settings.donate")}
                </p>
                <img src="buy-me-a-coffee-logo.png" alt="Buy Me A Coffee" className="h-16 w-auto" />
            </div>
        </a>
    );
}