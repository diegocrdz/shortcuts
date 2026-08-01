/**
 * Dashboard footer component.
 */

import { useNavigate } from "react-router-dom";
import { RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FooterProps {
    t: (key: string) => string;
    footerMsg: string;
    handleScanGames: () => void;
}

export function Footer({
    t,
    footerMsg,
    handleScanGames,
}: FooterProps) {
    const navigate = useNavigate();

    return (
        <div className="flex justify-between items-center gap-4 bg-background/30 px-8 py-4">
            <a
                href="https://github.com/diegocrdz/shortcuts"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-transparent rounded-full hover:border-white transition-border duration-200"
            >
                <img src="icon.png" alt="Logo" className="h-7 w-7" />
            </a>
            <div className="text-sm text-muted-foreground">
                {footerMsg}
            </div>
            <div className="space-x-4">
                <Tooltip>
                    <TooltipTrigger>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleScanGames}
                        >
                            <RotateCcw />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("shortcuts.actions.sync")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate("/settings")}
                        >
                            <Settings />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("settings.title")}
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}