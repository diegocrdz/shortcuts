/**
 * Add category button that opens a popover with a form to create a new category.
 */

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Category } from "@/types";
import CategoryMenu from "@/components/categories/CategoryMenu";
import { Button } from "@/components/ui/button";

const DEFAULT_ICON = "folder";

interface Props {
    onCreate: (category: Category) => void;
}

export default function AddCategory({
    onCreate
}: Props) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [icon, setIcon] = useState(DEFAULT_ICON);

    function handleSubmit() {
        const trimmed = name.trim();
        if (!trimmed) return;
        onCreate({ id: crypto.randomUUID(), name: trimmed, icon, deletable: true });
        setName("");
        setIcon(DEFAULT_ICON);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
                <Button
                    aria-label={t("categories.create")}
                >
                    <Plus />
                    {t("categories.create")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit">
                <CategoryMenu
                    mode="create"
                    name={name}
                    icon={icon}
                    onNameChange={setName}
                    onIconChange={setIcon}
                    onSubmit={handleSubmit}
                />
            </PopoverContent>
        </Popover>
    );
}