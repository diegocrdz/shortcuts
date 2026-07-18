/**
 * Search bar for shortcuts by name
 */

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

type SearchBarProps = {
    query: string;
    onQueryChange: (query: string) => void;
};

export default function SearchBar({
    query,
    onQueryChange,
}: SearchBarProps) {
    const { t } = useTranslation();

    return (
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
                type="text"
                autoFocus
                placeholder={t("searchBar.placeholder")}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="pl-10"
            />
        </div>
    );
}