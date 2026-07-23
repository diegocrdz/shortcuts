/**
* Main entry point for the application
*/

import { useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";

function AppRoutes() {
    const navigate = useNavigate();
    const { settings, updateSettings: updateContextSettings } = useSettings();

    // Check if onboarding should be shown
    useEffect(() => {
        if (settings.show_onboarding) {
            navigate("/onboarding");
        }
    }, [settings, navigate]);

    // Update settings
    function onFinishOnboarding() {
        if (settings) {
            updateContextSettings({ ...settings, show_onboarding: false });
        }
        navigate("/");
    }

    // Navigate to the dashboard when the window is focused
    useEffect(() => {
        const win = getCurrentWindow();
        const unlisten = win.listen("tauri://focus", () => {
            navigate("/");
        });
        return () => {
            unlisten.then((fn) => fn());
        };
    }, [navigate]);

    // Disable right-click context menu
    /*
    useEffect(() => {
        function disableContextMenu(e: MouseEvent) {
            e.preventDefault();
        }
        document.addEventListener("contextmenu", disableContextMenu);
        return () => {
            document.removeEventListener("contextmenu", disableContextMenu);
        };
    }, []);
    */

    return (
        <main className="bg-card/40 h-full">
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/onboarding" element={<Onboarding onFinish={onFinishOnboarding} />} />
            </Routes>
        </main>
    );
}

function App() {
    return (
        <BrowserRouter>
            <SettingsProvider>
                <TooltipProvider>
                    <AppRoutes />
                    <Toaster position="bottom-center" />
                </TooltipProvider>
            </SettingsProvider>
        </BrowserRouter>
    );
}

export default App;
