import { ArrowRight, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button, formatPercent } from "@hoa-mngr/ui";

import type { AssemblyRecordResponseDto } from "@/api/generated/model";
import { sharePercent } from "@/features/units/utils/shares";

interface PublishedStageProps {
    voteId: string;
    record: AssemblyRecordResponseDto;
}

/**
 * The end of the flow. Nothing here is editable — publishing closed the vote —
 * so the screen's job is to say what was written and where to see it.
 */
export function PublishedStage({ voteId, record }: PublishedStageProps) {
    const { t } = useTranslation(["voting"]);
    const totals = record.totals;

    const allVotes =
        sharePercent(
            Number(totals.allVotesWeight.num),
            Number(totals.allVotesWeight.den),
        ) || 1;
    const presentPercent =
        (sharePercent(
            Number(totals.presentWeight.num),
            Number(totals.presentWeight.den),
        ) /
            allVotes) *
        100;

    const rows = [
        {
            key: "attendance",
            label: t("voting:assemblyRecord.published.rowAttendance"),
            value: t("voting:assemblyRecord.published.rowAttendanceValue", {
                present: totals.presentUnitCount,
                total: record.units.length,
                percent: formatPercent(presentPercent, 1),
            }),
        },
        {
            key: "ballots",
            label: t("voting:assemblyRecord.published.rowBallots"),
            value: String(totals.presentUnitCount - totals.unitsAwaitingEntry),
        },
        {
            key: "visibleTo",
            label: t("voting:assemblyRecord.published.rowVisibleTo"),
            value: t("voting:assemblyRecord.published.rowVisibleToValue"),
        },
    ];

    return (
        <main className="mx-auto flex max-w-[520px] flex-col items-center px-4 py-12 text-center">
            <div className="bg-success-muted text-success mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full">
                <ShieldCheck className="h-9 w-9" />
            </div>
            <h1 className="font-display text-[26px] font-black tracking-[-0.4px]">
                {t("voting:assemblyRecord.published.title")}
            </h1>
            <p className="text-muted-foreground mt-2.5 mb-6 text-sm leading-[22px]">
                {t("voting:assemblyRecord.published.lead", {
                    title: record.voteTitle,
                })}
            </p>

            <div className="rounded-card bg-card shadow-clay-card mb-6 w-full overflow-hidden border text-left">
                {rows.map((row) => (
                    <div
                        key={row.key}
                        className="flex items-center justify-between gap-3 border-b px-4 py-3"
                    >
                        <span className="text-secondary-foreground text-[13px] font-medium">
                            {row.label}
                        </span>
                        <span className="text-right text-[13.5px] font-bold">
                            {row.value}
                        </span>
                    </div>
                ))}
                <p className="text-faint px-4 py-3 text-[12.5px] leading-[18px]">
                    {t("voting:assemblyRecord.published.auditNote")}
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5">
                <Button asChild>
                    <Link to={`/voting/${voteId}/results`}>
                        {t("voting:assemblyRecord.published.results")}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link to="/voting">
                        {t("voting:assemblyRecord.published.back")}
                    </Link>
                </Button>
            </div>
        </main>
    );
}
