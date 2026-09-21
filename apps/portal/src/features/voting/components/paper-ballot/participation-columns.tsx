import type { TFunction } from "i18next";
import { FileText } from "lucide-react";
import { Link } from "react-router";

import { Button, CellPrimary, StatusChip, type ColumnDef } from "@hoa-mngr/ui";

import type { VoteParticipationUnitDto } from "@/api/generated/model";

/** `DataTable` requires rows to carry an `id: string`; the participation DTO
 *  only has `unitId`, so callers map it onto `id` before handing rows in. */
export type ParticipationRow = VoteParticipationUnitDto & { id: string };

export function getParticipationColumns(
    t: TFunction<"voting">,
    formatDate: (iso: string) => string,
    onRecord: (unitId: string) => void,
    voteId: string,
): ColumnDef<ParticipationRow>[] {
    return [
        {
            id: "unitNo",
            // Search spans the unit number and its owners' names; the cell
            // still renders only the unit number.
            accessorFn: (unit) =>
                `${unit.unitNo} ${(unit.ownerNames ?? []).join(" ")}`,
            header: t("paperBallot.chooseUnit.columns.unit"),
            enableSorting: true,
            sortingFn: "localeNumeric",
            enableGlobalFilter: true,
            cell: ({ row }) => (
                <CellPrimary
                    title={row.original.unitNo}
                    subtitle={(row.original.ownerNames ?? []).join(", ")}
                />
            ),
        },
        {
            id: "share",
            accessorKey: "share",
            header: t("paperBallot.chooseUnit.columns.share"),
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <span className="text-secondary-foreground text-detail tabular-nums">
                    {row.original.share}
                </span>
            ),
        },
        {
            id: "status",
            accessorKey: "status",
            header: t("paperBallot.chooseUnit.columns.status"),
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const unit = row.original;
                if (unit.status === "VOTED") {
                    return (
                        <div className="min-w-0">
                            <StatusChip variant="success">
                                {t("paperBallot.chooseUnit.status.voted")}
                            </StatusChip>
                            {unit.castAt && (
                                <div className="text-faint text-2xs mt-0.5 truncate">
                                    {t(
                                        unit.castMethod === "BOARD_PROXY"
                                            ? "paperBallot.chooseUnit.status.votedOnPaper"
                                            : "paperBallot.chooseUnit.status.votedInApp",
                                        {
                                            date: formatDate(
                                                String(unit.castAt),
                                            ),
                                        },
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }
                if (unit.status === "INELIGIBLE") {
                    return (
                        <div className="min-w-0">
                            <StatusChip variant="neutral">
                                {t("paperBallot.chooseUnit.status.ineligible")}
                            </StatusChip>
                            {unit.ineligibleReason && (
                                <div className="text-faint text-2xs mt-0.5 truncate">
                                    {t(
                                        `paperBallot.chooseUnit.ineligibleReason.${unit.ineligibleReason}`,
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }
                return (
                    <div className="min-w-0">
                        <StatusChip variant="neutral" dot={false}>
                            {t("paperBallot.chooseUnit.status.notVoted")}
                        </StatusChip>
                        {unit.ineligibleReason && (
                            <div className="text-faint text-2xs mt-0.5 truncate">
                                {t(
                                    "paperBallot.chooseUnit.status.appUnavailable",
                                )}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            id: "action",
            header: t("paperBallot.chooseUnit.columns.action"),
            meta: { align: "right" },
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const unit = row.original;
                if (unit.status !== "NOT_VOTED") return null;
                if (unit.isOwnUnit) {
                    return (
                        <Link
                            to={`/voting/${voteId}/cast`}
                            className="text-primary-tint-foreground cursor-pointer text-sm font-medium hover:underline"
                        >
                            {t("paperBallot.chooseUnit.castInApp")} →
                        </Link>
                    );
                }
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRecord(unit.unitId)}
                    >
                        <FileText />
                        {t("paperBallot.chooseUnit.record")}
                    </Button>
                );
            },
        },
    ];
}
