/**
* General settings component
*/

import SettingsPage from "@/components/settings/SettingsLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/components/utils/FormatDate";
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

    const POSITION_OPTIONS = [
        { value: "bottom-center", label: t("settings.positionOptions.bottomCenter") },
        { value: "bottom-left", label: t("settings.positionOptions.bottomLeft") },
        { value: "center", label: t("settings.positionOptions.center") },
    ];

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
        toast.success(t("settings.dataDeleted"));
    }
    
    return (
        <SettingsPage
            name={t("settings.tabs.general.title")}
            description={t("settings.tabs.general.description")}
        >
        <div className="flex flex-col gap-8">
            {/* Position */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="position">{t("settings.position")}</Label>
                <Select
                    items={POSITION_OPTIONS}
                    value={settings.position}
                    onValueChange={(value) => {
                        if (value) updateSettings({ position: value });
                    }}
                >
                    <SelectTrigger className="w-full max-w-2/3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {POSITION_OPTIONS.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                {item.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

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
                    <SelectTrigger className="w-full max-w-2/3">
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
                    <SelectTrigger className="w-full max-w-2/3">
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
            <div className="flex flex-col gap-2 max-w-2/3">
                <div className="flex items-center justify-between">
                    <Label htmlFor="updateInterval">{t("settings.updateInterval")}</Label>
                    <Switch
                        checked={settings.sync_enabled}
                        onCheckedChange={(checked) => updateSettings({ sync_enabled: checked })}
                    />
                </div>

                {/* Label */}
                <p className="text-xs text-muted-foreground">
                    {t("settings.updateIntervalDescription")}
                </p>

                <Select
                    items={UPDATE_INTERVAL_OPTIONS}
                    value={settings.update_interval}
                    disabled={!settings.sync_enabled}
                    onValueChange={(value) => {
                        if (value) updateSettings({ update_interval: value });
                    }}
                >
                    <SelectTrigger className="w-full">
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
                <p className="text-sm text-muted-foreground">
                    {t("settings.lastSync.title")}: {formatDate(t, settings.last_sync)}
                </p>
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