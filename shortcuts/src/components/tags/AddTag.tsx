import { useState } from "react";
import { Tag } from "@/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import TagMenu from "@/components/tags/TagMenu";

const DEFAULT_COLOR = "#f59e0b";

interface Props {
  onCreate: (tag: Tag) => void;
}

export default function AddTag({ onCreate }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ id: crypto.randomUUID(), name: trimmed, color });
    setName("");
    setColor(DEFAULT_COLOR);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
            <Button variant="ghost" size="xs" className="cursor-pointer border-dashed border-primary/50 border rounded-full max-h-full">
                <Plus className="h-full w-auto" />
                {t("tags.create")}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit">
            <TagMenu
                mode="create"
                name={name}
                color={color}
                onNameChange={setName}
                onColorChange={setColor}
                onSubmit={handleSubmit}
            />
        </PopoverContent>
    </Popover>
  );
}