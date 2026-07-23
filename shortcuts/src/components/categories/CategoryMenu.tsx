/**
 * Tag Menu to create or edit a tag
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { Plus, Pencil } from "lucide-react";
import { ICON_MAP } from "@/components/categories/CategoryIcon";

interface Props {
    mode: "create" | "edit";
    name: string;
    icon: string;
    deletable?: boolean;
    onNameChange: (name: string) => void;
    onIconChange: (icon: string) => void;
    onSubmit: () => void;
}

export default function CategoryMenu({
    mode,
    name,
    icon,
    deletable,
    onNameChange,
    onIconChange,
    onSubmit,
}: Props) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-2 w-48">
            {/* Name input */}
            {deletable === undefined || deletable === true ? (
                <div className="space-y-2">
                    <Label>{t("categories.name")}</Label>
                    <Input
                        autoFocus
                        value={name}
                        placeholder={t("categories.namePlaceholder")}
                        maxLength={10}
                        onChange={(e) => onNameChange(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
            ) : null}

            {/* Icon selection */}
            <Label>{t("categories.icon")}</Label>
            <div className="flex gap-2 flex-wrap justify-between">
                {Object.entries(ICON_MAP).map(([name, item]) => {
                    const Icon = item;
                    return (
                        <Button
                            key={name}
                            variant={icon === name ? "default" : "outline"}
                            size="icon"
                            onClick={() => onIconChange(name)}
                        >
                            <Icon />
                        </Button>
                    );
                })}
            </div>
            
            {/* Actions */}
            {mode === "create" ? (
                <Button onClick={onSubmit} disabled={name.trim() === ""}>
                    <Plus />
                    {t("categories.create")}
                </Button>
            ) : mode === "edit" ? (
                <Button
                    onClick={onSubmit} disabled={name.trim() === ""}
                >
                    <Pencil />
                    {t("categories.edit")}
                </Button>
            ) : null}
        </div>
    );
}