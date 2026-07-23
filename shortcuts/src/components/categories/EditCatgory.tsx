/**
 * Edit category button that opens a popover with a form to edit the category name and icon.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Category } from "@/types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import CategoryMenu from "@/components/categories/CategoryMenu";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    category: Category;
    onUpdate: (updatedCategory: Category) => void;
}

export default function CategoryButton({
    category,
    onUpdate,
}: Props) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(category.name);
    const [icon, setIcon] = useState(category.icon);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("categories.edit")}
                >
                    <Pencil />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit">
                <CategoryMenu
                    mode="edit"
                    name={name}
                    icon={icon}
                    onNameChange={setName}
                    onIconChange={setIcon}
                    onSubmit={() => {
                        const trimmed = name.trim();
                        if (!trimmed) return;
                        onUpdate({ ...category, name: trimmed, icon });
                        setOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}