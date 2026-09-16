import { useTranslation } from "react-i18next";

import { formatPercent, StatusChip } from "@hoa-mngr/ui";

import type { AssemblyRecordResponseDto } from "@/api/generated/model";
import { sharePercent } from "@/features/units/utils/shares";

interface AttendanceCardProps {
    totals: AssemblyRecordResponseDto["totals"];
    unitCount: number;
}

/**
 * How much of the building was in the room.
 *
 * The denominator is every countable unit, including any with no common
 * representative — that is the quorum denominator the law uses, and it is the
 * same one `tally.ts` applies when the record is published.
 */
export function AttendanceCard({ totals, unitCount }: AttendanceCardProps) {
    const { t } = useTranslation(["voting"]);

    const presentPercent = sharePercent(
        Number(totals.presentWeight.num),
        Number(totals.presentWeight.den),
    );
    const allPercent =
        sharePercent(
            Number(totals.allVotesWeight.num),
            Number(totals.allVotesWeight.den),
        ) || 1;
    const fillPercent = Math.min(100, (presentPercent / allPercent) * 100);

    return (
        <div className="rounded-card bg-card shadow-clay-card flex h-full flex-col border p-4 px-5 pb-[18px]">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-display text-[28px] leading-none font-black tracking-[-0.6px]">
                        {formatPercent(fillPercent, 1)}
                    </p>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                        {t("voting:assemblyRecord.attendance.ofAllVotes")}
                    </p>
                </div>

                <div className="text-right">
                    <StatusChip
                        variant={totals.quorate ? "success" : "warning"}
                    >
                        {t(
                            totals.quorate
                                ? "voting:assemblyRecord.attendance.quorate"
                                : "voting:assemblyRecord.attendance.belowQuorum",
                        )}
                    </StatusChip>
                    <p className="mt-2 text-[13.5px] font-semibold">
                        {t("voting:assemblyRecord.attendance.presentOf", {
                            present: totals.presentUnitCount,
                            total: unitCount,
                        })}
                    </p>
                    <p className="text-muted-foreground text-[12.5px]">
                        {t(
                            "voting:assemblyRecord.attendance.absentAndNoOwner",
                            {
                                absent: totals.absentUnitCount,
                                ineligible: totals.ineligibleUnitCount,
                            },
                        )}
                    </p>
                </div>
            </div>

            <div className="mt-auto pt-4">
                <div className="bg-accent h-2 w-full overflow-hidden rounded-full">
                    <div
                        className="bg-primary h-full rounded-full transition-[width] motion-reduce:transition-none"
                        style={{ width: `${fillPercent}%` }}
                    />
                </div>

                <div className="text-faint mt-2 flex flex-wrap justify-between gap-2 text-[11.5px]">
                    <span>
                        {t("voting:assemblyRecord.attendance.quorumRule")}
                    </span>
                    <span>
                        {t("voting:assemblyRecord.attendance.sharesOnRecord", {
                            num: totals.allVotesWeight.num,
                            den: totals.allVotesWeight.den,
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
}
