import type { TFunction } from "i18next";

import { CellPrimary, StatusChip, type ColumnDef } from "@hoa-mngr/ui";

import type { LiveResultsRow } from "../../utils/live-results-filter";

/** How and when the ballot reached the vote. Board-only: the owner payload
 *  carries neither `castMethod` nor `castAt`, so nothing here can leak. */
function castDetailLine(
    unit: LiveResultsRow,
    t: TFunction<"voting">,
    formatDate: (iso: string) => string,
): string | null {
    if (!unit.castAt) return null;
    const date = formatDate(String(unit.castAt));
    if (unit.castMethod !== "BOARD_PROXY") {
        return t("liveResults.status.inApp", { date });
    }
    return unit.recordedBy
        ? t("liveResults.status.onPaperRecordedBy", {
              date,
              name: unit.recordedBy,
          })
        : t("liveResults.status.onPaper", { date });
}

export function getLiveResultsColumns({
    t,
    formatDate,
    isBoardView,
}: {
    t: TFunction<"voting">;
    formatDate: (iso: string) => string;
    isBoardView: boolean;
}): ColumnDef<LiveResultsRow>[] {
    return [
        {
            id: "unitNo",
            // Sorting reads this accessor, and it leads with the unit number
            // so the owner names trailing it never disturb the order.
            accessorFn: (unit) =>
                `${unit.unitNo} ${(unit.ownerNames ?? []).join(" ")}`,
            header: t("liveResults.columns.unit"),
            enableSorting: true,
            sortingFn: "localeNumeric",
            // The page filters rows through filterUnits before they reach the
            // table, so the table's own search never runs.
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const unit = row.original;
                // An owner payload has no ownerNames; passing "" would still
                // render CellPrimary's subtitle line, just empty.
                const ownerNames = isBoardView
                    ? (unit.ownerNames ?? []).join(", ") || undefined
                    : undefined;
                return (
                    <div className="flex min-w-0 items-center gap-2">
                        <CellPrimary
                            title={unit.unitNo}
                            subtitle={ownerNames}
                        />
                        {unit.ownsUnit ? (
                            <StatusChip
                                variant="primary"
                                dot={false}
                                className="shrink-0"
                            >
                                {t("liveResults.pill.yours")}
                            </StatusChip>
                        ) : unit.isProxy ? (
                            <StatusChip
                                variant="neutral"
                                dot={false}
                                className="shrink-0"
                            >
                                {t("liveResults.pill.proxy")}
                            </StatusChip>
                        ) : null}
                    </div>
                );
            },
        },
        {
            id: "share",
            accessorKey: "share",
            header: t("liveResults.columns.share"),
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
            header: t("liveResults.columns.status"),
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const unit = row.original;

                if (unit.status === "VOTED") {
                    const detail = isBoardView
                        ? castDetailLine(unit, t, formatDate)
                        : null;
                    return (
                        <div className="min-w-0">
                            <StatusChip variant="success">
                                {t("liveResults.status.voted")}
                            </StatusChip>
                            {detail && (
                                <div className="text-faint text-2xs mt-0.5 truncate">
                                    {detail}
                                </div>
                            )}
                        </div>
                    );
                }

                if (unit.status === "INELIGIBLE") {
                    // A missing common representative is the one reason an
                    // owner can still act on, so it reads as a prompt rather
                    // than as a closed door. The server already collapses
                    // this reason out of the owner payload, so `isBoardView`
                    // here is defence in depth, not the only guard — but it
                    // is the one place a server-side regression would
                    // otherwise become a visible leak rather than a missing
                    // field, on both the chip and the detail line below.
                    if (
                        isBoardView &&
                        unit.ineligibleReason === "NO_REPRESENTATIVE"
                    ) {
                        return (
                            <StatusChip variant="warning">
                                {t("liveResults.status.needsDelegation")}
                            </StatusChip>
                        );
                    }
                    return (
                        <div className="min-w-0">
                            <StatusChip variant="neutral">
                                {t("liveResults.status.ineligible")}
                            </StatusChip>
                            {isBoardView && unit.ineligibleReason && (
                                <div className="text-faint text-2xs mt-0.5 truncate">
                                    {t(
                                        `liveResults.status.ineligibleReason.${unit.ineligibleReason}`,
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <StatusChip variant="neutral" dot={false}>
                        {t("liveResults.status.notVoted")}
                    </StatusChip>
                );
            },
        },
    ];
}
