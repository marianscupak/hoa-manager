import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Card, DataTable } from "@hoa-mngr/ui";

import type {
    VoteParticipationUnitDto,
    VoteTurnoutResponseDto,
} from "@/api/generated/model";

import {
    getParticipationColumns,
    type ParticipationRow,
} from "./participation-columns";

export interface ChooseUnitStepProps {
    units: VoteParticipationUnitDto[];
    turnout: VoteTurnoutResponseDto | undefined;
    isLoading: boolean;
    voteId: string;
    onRecord: (unitId: string) => void;
    formatDate: (iso: string) => string;
}

export function ChooseUnitStep({
    units,
    turnout,
    isLoading,
    voteId,
    onRecord,
    formatDate,
}: ChooseUnitStepProps) {
    const { t } = useTranslation("voting");
    const { t: tCommon } = useTranslation("common");

    // DataTable requires rows to carry an `id: string`; the participation
    // DTO only has `unitId`.
    const rows: ParticipationRow[] = useMemo(
        () => units.map((unit) => ({ ...unit, id: unit.unitId })),
        [units],
    );

    const columns = useMemo(
        () => getParticipationColumns(t, formatDate, onRecord, voteId),
        [t, formatDate, onRecord, voteId],
    );

    const votedPct = turnout
        ? Number(turnout.participationWeight.decimal) * 100
        : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-foreground text-2xl font-extrabold tracking-tight">
                    {t("paperBallot.chooseUnit.title")}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {t("paperBallot.chooseUnit.subtitle")}
                </p>
            </div>

            {turnout && (
                <Card className="p-5">
                    <p className="text-sm font-semibold">
                        {t("paperBallot.chooseUnit.turnout", {
                            voted: turnout.participationUnitCount,
                            total: turnout.totalVotesUnitCount,
                        })}
                    </p>
                    <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-500 motion-reduce:transition-none"
                            style={{ width: `${votedPct}%` }}
                        />
                    </div>
                </Card>
            )}

            <DataTable
                columns={columns}
                data={rows}
                gridTemplate="1.5fr 0.7fr 1fr 1.1fr"
                isLoading={isLoading}
                loadingMessage={tCommon("loading")}
                emptyMessage={t("paperBallot.chooseUnit.empty")}
                emptySearchMessage={t("paperBallot.chooseUnit.noMatch")}
                searchPlaceholder={t(
                    "paperBallot.chooseUnit.searchPlaceholder",
                )}
                initialSorting={[{ id: "unitNo", desc: false }]}
                pageSize={10}
                countLabel={(info) =>
                    info.paginated
                        ? t("paperBallot.chooseUnit.range", {
                              from: info.from,
                              to: info.to,
                              total: info.total,
                          })
                        : t("paperBallot.chooseUnit.count", {
                              count: info.total,
                          })
                }
                paginationLabels={{
                    previous: tCommon("pagination.previous"),
                    next: tCommon("pagination.next"),
                }}
            />

            <p className="text-muted-foreground text-sm">
                {t("paperBallot.chooseUnit.footnote")}
            </p>
        </div>
    );
}
