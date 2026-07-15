/**
 * Tag Menu to create or edit a tag
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash, Plus, Check, } from "lucide-react";

const COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#64748b", "#f97316", "#eab308", "#14b8a6"];

interface Props {
  mode: "create" | "edit";
  name: string;
  color: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onSubmit: () => void; // "Crear" en modo create, no se usa en modo edit
  onDelete?: () => void; // solo modo edit
}

export default function TagMenu({ mode, name, color, onNameChange, onColorChange, onSubmit, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-2 w-48">
        <Label>Nombre</Label>
        <Input
            autoFocus
            value={name}
            placeholder="Nueva etiqueta"
            maxLength={20}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
        />

        <Label>Colores</Label>
        <div className="flex gap-2 flex-wrap justify-between">
            {COLORS.map((c) => (
                <div
                    key={c}
                    onClick={() => onColorChange(c)}
                    style={{ backgroundColor: c }}
                    className={`relative h-7 w-7 rounded-full cursor-pointer border-2 ${c === color ? "border-primary" : "border-transparent"}`}
                >
                    <Check className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white ${c === color ? "opacity-100" : "opacity-0"}`} size={16} />
                </div>
            ))}
        </div>

        {mode === "create" ? (
            <Button onClick={onSubmit} disabled={name.trim() === ""}>
                <Plus />
                Crear
            </Button>
        ) : (
            <Button
                onClick={onDelete}
                variant="destructive"
            >
                <Trash />
                Eliminar
            </Button>
        )}
    </div>
  );
}