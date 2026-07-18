import { useState } from "react";
import { Tag } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CirclePlus } from "lucide-react";
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
            <Badge variant="outline" className="cursor-pointer border-dashed border h-full">
                <CirclePlus />
                {t("tags.create")}
            </Badge>
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