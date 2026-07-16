/**
 * General settings component
 */

import SettingsPage from "@/components/settings/SettingsPage";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/contexts/SettingsContext";
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

const THEME_OPTIONS = [
    { value: "light", label: "Claro" },
    { value: "dark", label: "Oscuro" },
    { value: "system", label: "Sistema" },
];

const LANG_OPTIONS = [
    { value: "en", label: "Inglés" },
    { value: "es", label: "Español" },
];

const UPDATE_INTERVAL_OPTIONS = [
    { value: 1, label: "1 hora" },
    { value: 6, label: "6 horas" },
    { value: 12, label: "12 horas" },
    { value: 24, label: "24 horas" },
];

export default function GeneralSettings() {
    const [resetOpen, setResetOpen] = useState(false);
    const { settings, updateSettings, resetSettings } = useSettings();

    return (
        <SettingsPage
            name="General"
            description="Configuración general de la aplicación."
        >
            <div className="flex flex-col gap-8">
                {/* Suggestions */}
                <a href="https://buymeacoffee.com/diego_cordova" target="_blank">
                    <div className="flex gap-4 items-center bg-yellow-300/80 p-4 rounded-md">
                        <p className="text-secondary font-semibold text-sm">
                            Si te gusta la aplicación, considera donar un café.
                        </p>
                        <img src="buy-me-a-coffee-logo.png" alt="Buy Me A Coffee" className="h-16 w-auto" />
                    </div>
                </a>

                {/* Theme */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="theme">Tema</Label>
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
                    <Label htmlFor="theme">Idioma</Label>
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
                    <Label htmlFor="theme">Intervalo de actualización</Label>
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
                                    Reestablecer configuración
                                </Button>
                            }
                        />
                        <AlertDialogContent size="sm">
                            <AlertDialogHeader>
                                <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                                    <TrashIcon />
                                </AlertDialogMedia>
                                <AlertDialogTitle>
                                    ¿Reestablecer la configuración?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción reestablecerá todas las configuraciones a sus valores predeterminados. No se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel variant="outline">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    variant="destructive"
                                    onClick={async () => {
                                        await resetSettings();
                                        setResetOpen(false);
                                    }}
                                >
                                    Reestablecer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </SettingsPage>
    );
}