import { CheckIcon, SearchIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import {
    filterRoster,
    rosterState,
    type AssemblyUnit,
    type RosterFilter,
    type RosterState,
} from "./roster";

/** Dot colours carry the same meaning as the right-hand marker. */
const DOT: Record<RosterState, string> = {
    complete: "bg-success",
    toEnter: "bg-warning",
    absent: "bg-border",
    ineligible: "bg-accent",
    unset: "bg-border",
};

/** Spelled out rather than interpolated: the i18n keys are typed. */
const FILTER_KEY = {
    all: "voting:assemblyRecord.roster.filters.all",
    todo: "voting:assemblyRecord.roster.filters.todo",
    present: "voting:assemblyRecord.roster.filters.present",
    absent: "voting:assemblyRecord.roster.filters.absent",
} as const;

const MARKER_KEY = {
    complete: "voting:assemblyRecord.roster.marker.complete",
    toEnter: "voting:assemblyRecord.roster.marker.toEnter",
    absent: "voting:assemblyRecord.roster.marker.absent",
    ineligible: "voting:assemblyRecord.roster.marker.ineligible",
    unset: "voting:assemblyRecord.roster.marker.unset",
} as const;

const FILTERS: RosterFilter[] = ["all", "todo", "present", "absent"];

interface RosterRailProps {
    units: AssemblyUnit[];
    questionCount: number;
    selectedUnitId: string | null;
    search: string;
    filter: RosterFilter;
    onSearchChange: (value: string) => void;
    onFilterChange: (value: RosterFilter) => void;
    onSelect: (unitId: string) => void;
}

export function RosterRail({
    units,
    questionCount,
    selectedUnitId,
    search,
    filter,
    onSearchChange,
    onFilterChange,
    onSelect,
}: RosterRailProps) {
    const { t } = useTranslation(["voting"]);
    const visible = filterRoster(units, questionCount, filter, search);

    const countFor = (f: RosterFilter) =>
        filterRoster(units, questionCount, f, "").length;

    return (
        <div className="rounded-card bg-card shadow-clay-card flex flex-col border p-4">
            <div className="relative">
                <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t("voting:assemblyRecord.roster.search")}
                    className="h-9 rounded-full pl-9"
                />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => onFilterChange(f)}
                        className={cn(
                            "h-7 cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors",
                            f === filter
                                ? "bg-primary text-primary-foreground shadow-clay-btn-sm"
                                : "bg-accent text-secondary-foreground hover:bg-border",
                        )}
                    >
                        {t(FILTER_KEY[f])}{" "}
                        <span className="font-medium opacity-70">
                            {countFor(f)}
                        </span>
                    </button>
                ))}
            </div>

            <ul className="mt-3 max-h-[520px] overflow-y-auto">
                {visible.map((unit) => {
                    const state = rosterState(unit, questionCount);
                    const selected = unit.unitId === selectedUnitId;
                    return (
                        <li key={unit.unitId}>
                            <button
                                type="button"
                                onClick={() => onSelect(unit.unitId)}
                                aria-current={selected}
                                className={cn(
                                    "flex w-full cursor-pointer items-center gap-2.5 border-l-[3px] py-2 pr-2 pl-2.5 text-left transition-colors",
                                    selected
                                        ? "border-l-primary bg-primary-faint"
                                        : "border-l-transparent hover:bg-accent",
                                )}
                            >
                                <span
                                    className={cn(
                                        "h-2 w-2 shrink-0 rounded-full",
                                        DOT[state],
                                    )}
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13.5px] font-semibold">
                                        {unit.unitNo}
                                    </span>
                                    <span className="text-muted-foreground block truncate text-[11.5px]">
                                        {unit.owners.length > 0
                                            ? unit.owners
                                                  .map((o) => o.displayName)
                                                  .join(", ")
                                            : t(
                                                  "voting:assemblyRecord.roster.noOwner",
                                              )}
                                    </span>
                                </span>
                                {state === "complete" ? (
                                    <span className="bg-success-muted text-success-tint-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                                        <CheckIcon
                                            className="h-3 w-3"
                                            strokeWidth={3}
                                        />
                                    </span>
                                ) : (
                                    <span
                                        className={cn(
                                            "shrink-0 text-[11px] font-medium",
                                            state === "toEnter"
                                                ? "text-warning-tint-foreground"
                                                : "text-faint",
                                        )}
                                    >
                                        {t(MARKER_KEY[state])}
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>

            <p className="text-faint mt-3 text-[11.5px]">
                {t("voting:assemblyRecord.roster.showing", {
                    shown: visible.length,
                    total: units.length,
                })}
            </p>
        </div>
    );
}
