/**
 * Settings Context
 * 
 * This context provides access to the application settings and allows for updating and resetting them.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Theme } from "@/types";

interface Settings {
    theme: Theme;
    language: string;
    update_interval: number;
}

interface SettingsContextValue {
    settings: Settings;
    updateSettings: (partial: Partial<Settings>) => Promise<void>;
    resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyTheme(theme: Theme) {
    const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings | null>(null);

    useEffect(() => {
        invoke<Settings>("get_settings").then((loaded) => {
            setSettings(loaded);
            applyTheme(loaded.theme);
        });
    }, []);

    useEffect(() => {
        if (settings?.theme !== "system") return;
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        const listener = () => applyTheme("system");
        mql.addEventListener("change", listener);
        return () => mql.removeEventListener("change", listener);
    }, [settings?.theme]);

    async function updateSettings(partial: Partial<Settings>) {
        if (!settings) return;
        const next = { ...settings, ...partial };
        setSettings(next);
        applyTheme(next.theme);
        await invoke("update_settings", { settings: next });
    }

    async function resetSettings() {
        const defaults = await invoke<Settings>("reset_settings");
        setSettings(defaults);
        applyTheme(defaults.theme);
    }

    if (!settings) return null;

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
    return ctx;
}