/**
* Main entry point for the application
*/

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Toaster } from "@/components/ui/sonner"

import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";

function AppRoutes() {
    const navigate = useNavigate();

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
    useEffect(() => {
        function disableContextMenu(e: MouseEvent) {
            e.preventDefault();
        }
        document.addEventListener("contextmenu", disableContextMenu);
        return () => {
            document.removeEventListener("contextmenu", disableContextMenu);
        };
    }, []);

    return (
        <main className="bg-card/60 h-full">
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </main>
    );
}

function App() {
    return (
        <BrowserRouter>
            <SettingsProvider>
                <AppRoutes />
                <Toaster position="bottom-right" />
            </SettingsProvider>
        </BrowserRouter>
    );
}

export default App;
