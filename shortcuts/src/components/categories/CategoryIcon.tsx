/**
 * Category icons map and function for rendering category icons based on their name.
 */

import {
    type LucideIcon,
    GraduationCap,
    Rocket,
    Gamepad2,
    Folder,
    Briefcase,
    Palette,
    Code,
    Clapperboard,
    Music,
    Hammer,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
    "folder": Folder,
    "graduation-cap": GraduationCap,
    "rocket": Rocket,
    "gamepad": Gamepad2,
    "briefcase": Briefcase,
    "palette": Palette,
    "code": Code,
    "clapperboard": Clapperboard,
    "music": Music,
    "hammer": Hammer,
};

/**
 * Render the icon for a given category name.
 * @props {string} name - The name of the category icon to render.
 * @returns {JSX.Element} The rendered icon component.
 */
export function CategoryIcon({ name }: { name: string }) {
    const Icon = ICON_MAP[name] ?? Folder;
    return <Icon className="h-4 w-4" />;
}