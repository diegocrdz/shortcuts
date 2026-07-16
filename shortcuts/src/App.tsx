/**
* Main entry point for the application
*/

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";

function App() {
    return (
        <BrowserRouter>
            <SettingsProvider>
                <main className="bg-card/60 h-full">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
            </SettingsProvider>
        </BrowserRouter>
    );
}

export default App;
