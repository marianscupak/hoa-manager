import { useTranslation } from "react-i18next";

import { cn } from "@hoa-mngr/ui/lib/utils";

export type FilterType = "ALL" | "OPEN" | "SCHEDULED" | "CLOSED";

interface VotingFilterProps {
    filter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

export function VotingFilter({ filter, onFilterChange }: VotingFilterProps) {
    const { t } = useTranslation(["voting"]);

    const filters: { key: FilterType; label: string }[] = [
        { key: "ALL", label: t("list.filters.all") },
        { key: "OPEN", label: t("list.filters.open") },
        { key: "SCHEDULED", label: t("list.filters.scheduled") },
        { key: "CLOSED", label: t("list.filters.closed") },
    ];

    return (
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {filters.map((f) => (
                <button
                    key={f.key}
                    onClick={() => onFilterChange(f.key)}
                    className={cn(
                        "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                        filter === f.key
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-500 hover:text-slate-900",
                    )}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}
