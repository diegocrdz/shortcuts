/**
 * Search bar for shortcuts by name
 */

import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

type SearchBarProps = {
    ref?: React.Ref<HTMLInputElement>;
    query: string;
    onQueryChange: (query: string) => void;
};

export default function SearchBar({
    ref,
    query,
    onQueryChange,
}: SearchBarProps) {
    const { t } = useTranslation();

    return (
        <div className="relative flex-1">
            <InputGroup>
                <InputGroupInput
                    ref={ref}
                    placeholder={t("searchBar.placeholder")}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                />
                <InputGroupAddon>
                    <Search />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                    <Kbd>Ctrl</Kbd>
                    <Kbd>Alt</Kbd>
                    <Kbd>S</Kbd>
                </InputGroupAddon>
            </InputGroup>
        </div>
    );
}