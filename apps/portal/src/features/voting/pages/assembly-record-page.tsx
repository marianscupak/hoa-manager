import { CheckCircle2, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router";

import { Button, ErrorState, PageLoading } from "@hoa-mngr/ui";

import { AttendanceCard } from "@/features/voting/components/assembly-record/attendance-card";
import { RecordHeader } from "@/features/voting/components/assembly-record/record-header";
import type { RosterFilter } from "@/features/voting/components/assembly-record/roster";
import { RosterRail } from "@/features/voting/components/assembly-record/roster-rail";
import { RunningCountCard } from "@/features/voting/components/assembly-record/running-count-card";
import { UnitPanel } from "@/features/voting/components/assembly-record/unit-panel";
import { useAssemblyRecord } from "@/features/voting/hooks/use-assembly-record";

/**
 * The board transcribes a meeting that already happened, unit by unit.
 *
 * Focus mode, the same shell as the create wizard and the paper-ballot flow:
 * the vote stays in DRAFT throughout, which is what keeps it invisible to
 * owners until it is published.
 */
export function AssemblyRecordPage() {
    const { id = "" } = useParams();
    const { t } = useTranslation(["voting"]);

    const {
        record,
        isLoading,
        isError,
        markPresent,
        markAbsent,
        answer,
        isSaving,
    } = useAssemblyRecord(id);

    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<RosterFilter>("all");

    const questionCount = record?.questions.length ?? 0;
    const units = useMemo(() => record?.units ?? [], [record]);

    const selected =
        units.find((u) => u.unitId === selectedUnitId) ?? units[0] ?? null;
    const selectedIndex = selected
        ? units.findIndex((u) => u.unitId === selected.unitId)
        : -1;

    const step = (delta: number) => {
        if (units.length === 0) return;
        const next = (selectedIndex + delta + units.length) % units.length;
        setSelectedUnitId(units[next].unitId);
    };

    if (isLoading) return <PageLoading />;
    if (isError || !record) {
        return <ErrorState message={t("voting:assemblyRecord.loadError")} />;
    }

    // Nothing on this screen can be saved once the record is published, and
    // every control here would answer with a 409. The published screen is
    // where that state belongs.
    if (record.status !== "DRAFT") {
        return <Navigate to={`/voting/${id}/assembly-record/review`} replace />;
    }

    const awaiting = record.totals.unitsAwaitingEntry;

    return (
        <div className="bg-background min-h-screen">
            <RecordHeader
                voteId={id}
                title={record.voteTitle}
                meetingDate={record.meetingDate}
                published={false}
            />

            <main className="mx-auto max-w-[1200px] space-y-4 px-4 py-5 pb-24">
                <div className="grid gap-4 lg:grid-cols-2">
                    <AttendanceCard
                        totals={record.totals}
                        unitCount={units.length}
                    />

                    <RunningCountCard
                        questions={record.questions}
                        totals={record.totals}
                        weightBasis={record.weightBasis}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-[330px_1fr]">
                    <RosterRail
                        units={units}
                        questionCount={questionCount}
                        selectedUnitId={selected?.unitId ?? null}
                        search={search}
                        filter={filter}
                        onSearchChange={setSearch}
                        onFilterChange={setFilter}
                        onSelect={setSelectedUnitId}
                    />

                    {selected ? (
                        <UnitPanel
                            unit={selected}
                            questions={record.questions}
                            index={selectedIndex}
                            total={units.length}
                            allVotesWeight={record.totals.allVotesWeight}
                            onPrev={() => step(-1)}
                            onNext={() => step(1)}
                            onPresent={(voter) =>
                                markPresent(selected.unitId, voter)
                            }
                            onAbsent={() => markAbsent(selected.unitId)}
                            onAnswer={(answers) =>
                                answer(selected.unitId, answers)
                            }
                        />
                    ) : (
                        <div className="rounded-card bg-card text-muted-foreground border p-8 text-center text-sm">
                            {t("voting:assemblyRecord.noUnits")}
                        </div>
                    )}
                </div>
            </main>

            <footer className="bg-card fixed inset-x-0 bottom-0 border-t">
                <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        {isSaving ? (
                            <Loader2 className="text-primary h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="text-success h-4 w-4" />
                        )}
                        {t("voting:assemblyRecord.footer.autosave")}
                        {" · "}
                        {awaiting > 0
                            ? t("voting:assemblyRecord.footer.stillToEnter", {
                                  count: awaiting,
                              })
                            : t("voting:assemblyRecord.footer.allEntered")}
                    </p>
                    <Button asChild>
                        <Link to={`/voting/${id}/assembly-record/review`}>
                            {t("voting:assemblyRecord.footer.review")}
                        </Link>
                    </Button>
                </div>
            </footer>
        </div>
    );
}
