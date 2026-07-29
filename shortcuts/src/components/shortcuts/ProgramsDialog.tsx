/**
 * Dialog that displays a list of installed programs and allows the user to select one/many to create shortcuts.
 */

import { useEffect, useState } from "react";
import { TFunction } from "i18next";
import { Program } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getInstalledPrograms } from "@/lib/api/installedPrograms";
import { Button } from "@/components/ui/button";
import { Folder } from "lucide-react";
import { ProgramRow } from "@/components/shortcuts/ProgramRow";
import { createShortcut, createManualShortcut } from "@/lib/api/shortcuts";
import SearchBar from "@/components/SearchBar";
import SelectionBadge from "@/components/utils/SelectionBadge";

interface ProgramsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    t: TFunction;
}

export function ProgramsDialog({
    isOpen,
    onClose,
    t,
}: ProgramsDialogProps) {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedPrograms, setSelectedPrograms] = useState<Program[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter programs based on search query
    const filteredPrograms = programs.filter((program) =>
        program.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            getInstalledPrograms().then((programs) => {
                setPrograms(programs);
            });
        }
    }, [isOpen]);

    // Select a program to create a shortcut
    const handleSelectProgram = (program: Program) => {
        if (selectedPrograms.some((p) => p.id === program.id)) {
            setSelectedPrograms(selectedPrograms.filter((p) => p.id !== program.id));
        } else {
            setSelectedPrograms([...selectedPrograms, program]);
        }
    };

    // Create shortcuts for the selected programs
    const createShortcuts = async () => {
        for (const program of selectedPrograms) {
            await createShortcut(program);
        }
        onClose();
        setSelectedPrograms([]);
    }

    return (
        <Dialog
            open={isOpen}
            onOpenChange={() => {
                onClose();
                setSelectedPrograms([]);
            }}
        >
            <DialogContent className="max-h-[80vh] flex flex-col">
                {/* Header */}
                <DialogHeader>
                    <DialogTitle>{t("shortcuts.actions.addTitle")}</DialogTitle>
                    <DialogDescription>{t("shortcuts.actions.addDescription")}</DialogDescription>
                </DialogHeader>

                {/* Search bar and create button */}
                <div className="flex items-center gap-4">
                    <SearchBar
                        showKbd={false}
                        query={searchQuery}
                        onQueryChange={setSearchQuery}
                    />
                    <Button size="icon" onClick={createManualShortcut}>
                        <Folder />
                    </Button>
                </div>

                {/* Programs list */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {filteredPrograms.map((program) => (
                        <ProgramRow
                            key={program.id}
                            program={program}
                            selected={selectedPrograms.some((p) => p.id === program.id)}
                            onSelect={handleSelectProgram}
                        />
                    ))}
                </div>

                {/* Selection badge */}
                {selectedPrograms.length > 0 && (
                    <SelectionBadge
                        t={t}
                        bottom={4}
                        selectedCount={selectedPrograms.length}
                        onAddShortcut={createShortcuts}
                        onClearSelection={() => setSelectedPrograms([])}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}