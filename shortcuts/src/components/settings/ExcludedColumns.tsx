/**
 * Column definition for the excluded shortcuts table in the settings page.
 */

import { ColumnDef } from "@tanstack/react-table"

import { Shortcut } from "@/types"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import {
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    RotateCcw,
    Trash
} from "lucide-react"

interface ColumnHandlers {
    t: (key: string) => string;
    onRestore?: (shortcut: Shortcut) => void;
    onDelete?: (shortcut: Shortcut) => void;
}

export function getColumns({
    t,
    onRestore,
    onDelete,
}: ColumnHandlers): ColumnDef<Shortcut>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0"
                >
                    {t("shortcuts.columns.name")}
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown />
                    ) : (
                        <ArrowUpDown />
                    )}
                </Button>
            ),
        },
        {
            accessorKey: "source",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0"
                >
                    {t("shortcuts.columns.source")}
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown />
                    ) : (
                        <ArrowUpDown />
                    )}
                </Button>
            ),
            cell: ({ row }) => {
                const shortcut = row.original;
                return (
                    <span className="capitalize">
                        {shortcut.source}
                    </span>
                );
            }
        },
        {
            id: "actions",
            header: () => <span>{t("shortcuts.columns.actions")}</span>,
            cell: ({ row }) => {
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                if (onRestore) {
                                    onRestore(row.original);
                                }
                            }}
                        >
                            <RotateCcw />
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                                if (onDelete) {
                                    onDelete(row.original);
                                }
                            }}
                        >
                            <Trash />
                        </Button>
                    </div>
                );
            },
        },
    ];
}