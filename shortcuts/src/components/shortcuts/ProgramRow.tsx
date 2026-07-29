/**
 * Program row that displays the program name and icon, and allows the user to select it to create a shortcut.
 */

import { Program } from "@/types";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Checkbox } from "@/components/ui/checkbox";

interface ProgramRowProps {
    program: Program;
    selected: boolean;
    onSelect: (program: Program) => void;
}

export function ProgramRow({
    program,
    selected,
    onSelect
}: ProgramRowProps) {
    return (
        <div
            className={`flex items-center justify-between gap-2 p-2
                hover:bg-muted/50 cursor-pointer rounded-md overflow-hidden
                border
                ${selected ? "bg-muted/50 border-border" : "border-transparent"}
            `}
            onClick={() => onSelect(program)}
        >
            <div className="flex items-center gap-4 flex-1">
                {program.icon_path && (
                    <img
                        src={convertFileSrc(program.icon_path)}
                        alt={`${program.name} icon`}
                        className="w-6 h-6 shrink-0"
                    />
                )}
                <div className="w-0 flex-1 min-w-0">
                    <p className="truncate">{program.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{program.target}</p>
                </div>
            </div>
            <Checkbox checked={selected} onCheckedChange={() => onSelect(program)} />
        </div>
    );
}