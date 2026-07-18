/**
 * General settings component
 */

import SettingsPage from "@/components/settings/SettingsPage";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import {
    TrashIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function GeneralSettings() {
    const { t } = useTranslation();
    const [resetOpen, setResetOpen] = useState(false);
    const { settings, updateSettings, resetSettings } = useSettings();

    // Constants
    const THEME_OPTIONS = [
        { value: "light", label: t("settings.themeOptions.light") },
        { value: "dark", label: t("settings.themeOptions.dark") },
        { value: "system", label: t("settings.themeOptions.system") },
    ];

    const LANG_OPTIONS = [
        { value: "en", label: t("settings.languageOptions.en") },
        { value: "es", label: t("settings.languageOptions.es") },
    ];

    const UPDATE_INTERVAL_OPTIONS = [
        { value: 1, label: t("settings.updateIntervalOptions.1") },
        { value: 6, label: t("settings.updateIntervalOptions.6") },
        { value: 12, label: t("settings.updateIntervalOptions.12") },
        { value: 24, label: t("settings.updateIntervalOptions.24") },
    ];

    // Reset settings
    async function handleReset() {
        setResetOpen(false);
        await resetSettings();
        toast.success(toast.success(t("settings.dataDeleted")));
    }

    return (
        <SettingsPage
            name={t("settings.tabs.general")}
            description={t("settings.description")}
        >
            <div className="flex flex-col gap-8">
                {/* Suggestions */}
                <a href="https://buymeacoffee.com/diego_cordova" target="_blank">
                    <div className="flex gap-4 items-center bg-yellow-300/40 p-4 rounded-md">
                        <p className="font-semibold text-sm">
                            {t("settings.donate")}
                        </p>
                        <img src="buy-me-a-coffee-logo.png" alt="Buy Me A Coffee" className="h-16 w-auto" />
                    </div>
                </a>

                {/* Theme */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="theme">{t("settings.theme")}</Label>
                    <Select
                        items={THEME_OPTIONS}
                        value={settings.theme}
                        onValueChange={(value) => {
                            if (value) updateSettings({ theme: value });
                        }}
                    >
                        <SelectTrigger className="w-full max-w-1/2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {THEME_OPTIONS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* Language */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="language">{t("settings.language")}</Label>
                    <Select
                        items={LANG_OPTIONS}
                        value={settings.language}
                        onValueChange={(value) => {
                            if (value) updateSettings({ language: value });
                        }}
                    >
                        <SelectTrigger className="w-full max-w-1/2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {LANG_OPTIONS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* Update Interval */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="updateInterval">{t("settings.updateInterval")}</Label>
                    <Select
                        items={UPDATE_INTERVAL_OPTIONS}
                        value={settings.update_interval}
                        onValueChange={(value) => {
                            if (value) updateSettings({ update_interval: value });
                        }}
                    >
                        <SelectTrigger className="w-full max-w-1/2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {UPDATE_INTERVAL_OPTIONS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* Reset Button */}
                <div className="flex flex-col gap-2">
                    <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                        <AlertDialogTrigger
                            render={
                                <Button variant="destructive" className="w-full max-w-1/2">
                                    <TrashIcon />
                                    {t("settings.deleteData")}
                                </Button>
                            }
                        />
                        <AlertDialogContent size="sm">
                            <AlertDialogHeader>
                                <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                                    <TrashIcon />
                                </AlertDialogMedia>
                                <AlertDialogTitle>
                                    {t("settings.deleteDataConfirmTitle")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t("settings.deleteDataConfirmDescription")}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel variant="outline">{t("settings.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                    variant="destructive"
                                    onClick={handleReset}
                                >
                                    {t("settings.deleteData")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </SettingsPage>
    );
}