import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { LiveResultsFilter } from "../../utils/live-results-filter";

/** The pill set, and with it the keys `counts` must carry. Exported so the
 *  page derives its counts from the same list the toolbar renders. */
export const FILTERS: LiveResultsFilter[] = ["all", "voted", "notVoted"];

interface LiveResultsToolbarProps {
    search: string;
    onSearchChange: (search: string) => void;
    filter: LiveResultsFilter;
    onFilterChange: (filter: LiveResultsFilter) => void;
    /** Counts over the unfiltered rows, so a pill states how much of the vote
     *  it selects rather than restating the current search. */
    counts: Record<LiveResultsFilter, number>;
    searchPlaceholder: string;
}

export function LiveResultsToolbar({
    search,
    onSearchChange,
    filter,
    onFilterChange,
    counts,
    searchPlaceholder,
}: LiveResultsToolbarProps) {
    const { t } = useTranslation("voting");

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[300px]">
                <Search className="text-faint pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                    type="search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    className="h-9 pl-9"
                />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {FILTERS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={filter === key}
                        onClick={() => onFilterChange(key)}
                        className={cn(
                            "text-detail cursor-pointer rounded-full border px-3 py-1.5 font-semibold transition-colors",
                            filter === key
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-card border-border text-secondary-foreground hover:bg-muted",
                        )}
                    >
                        {t(`liveResults.filters.${key}`)} · {counts[key]}
                    </button>
                ))}
            </div>
        </div>
    );
}
