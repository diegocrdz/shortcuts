/**
 * Add shotcut button.
 */

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AddShortcut({ onClick }: { onClick: () => void }) {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={onClick}
        >
            <Plus />
        </Button>
    );
}