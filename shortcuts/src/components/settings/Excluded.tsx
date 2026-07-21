/**
 * Excluded shortcuts config component
 */

import SettingsLayout from "@/components/settings/SettingsLayout";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/data-table";
import { useState, useEffect } from "react";
import { getExcludedShortcuts } from "@/lib/api/shortcuts";
import { Shortcut } from "@/types";
import { getColumns } from "@/components/settings/ExcludedColumns";
import { restoreExcludedShortcut, deleteExcludedShortcut } from "@/lib/api/shortcuts";

export default function Excluded() {
    const { t } = useTranslation();
    const [excludedShortcuts, setExcludedShortcuts] = useState<Shortcut[]>([]);

    async function fetchShortcuts() {
        const excluded = await getExcludedShortcuts();
        setExcludedShortcuts(excluded);
    }

    useEffect(() => {
        fetchShortcuts();
    }, []);

    function onRestore(shortcut: Shortcut) {
        restoreExcludedShortcut(shortcut.id).then(() => {
            fetchShortcuts();
        });
    }

    function onDelete(shortcut: Shortcut) {
        deleteExcludedShortcut(shortcut.id).then(() => {
            fetchShortcuts();
        });
    }

    return (
        <SettingsLayout
            name={t("settings.tabs.excluded.title")}
            description={t("settings.tabs.excluded.description")}
        >
            <div className="flex flex-col gap-8">
                <DataTable
                    data={excludedShortcuts}
                    columns={getColumns({ t, onRestore, onDelete })}
                    onRestore={onRestore}
                />
            </div>
        </SettingsLayout>
    );
}