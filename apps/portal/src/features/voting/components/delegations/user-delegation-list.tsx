import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Button,
    DataTable,
    EmptyState,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    type ColumnDef,
    toast,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { VoteConsentResponseDto } from "@/api/generated/model";
import {
    useVotesControllerGetConsents,
    useVotesControllerGetVotes,
    useVotesControllerRevokeConsent,
} from "@/api/generated/votes/votes";

export function UserDelegationList() {
    const { t } = useTranslation(["voting", "common"]);
    const queryClient = useQueryClient();
    const [selectedVoteId, setSelectedVoteId] = useState<string>("");

    const { data: consents, isLoading: isLoadingConsents } =
        useVotesControllerGetConsents();
    const { data: votes, isLoading: isLoadingVotes } =
        useVotesControllerGetVotes();
    const { mutate: revoke, isPending: isRevoking } =
        useVotesControllerRevokeConsent();

    const scheduledVotes = useMemo(() => {
        if (!votes || !consents) return [];
        const voteIdsWithConsents = new Set(consents.map((c) => c.voteId));
        return (
            votes.filter(
                (v) =>
                    v.status === "SCHEDULED" && voteIdsWithConsents.has(v.id),
            ) || []
        );
    }, [votes, consents]);

    const effectiveSelectedVoteId =
        selectedVoteId || scheduledVotes[0]?.id || "";

    const filteredConsents = useMemo(() => {
        if (!consents || !effectiveSelectedVoteId) return [];

        return consents.filter(
            (c) =>
                c.voteStatus === "SCHEDULED" &&
                c.voteId === effectiveSelectedVoteId,
        );
    }, [consents, effectiveSelectedVoteId]);

    const isLoading = isLoadingConsents || isLoadingVotes;

    if (!isLoading && (!consents || consents.length === 0)) {
        return <EmptyState message={t("voting:delegations.empty.all")} />;
    }

    const handleRevoke = (id: string) => {
        revoke(
            { id },
            {
                onSuccess: () => {
                    toast.success(t("voting:delegations.table.revokeSuccess"));
                    queryClient.invalidateQueries({ queryKey: ["/api/votes"] });
                    queryClient.invalidateQueries({
                        queryKey: ["/api/votes/consents"],
                    });
                },
                onError: (error) => {
                    showApiError(error);
                },
            },
        );
    };

    const columns: ColumnDef<VoteConsentResponseDto>[] = [
        {
            id: "unit",
            accessorKey: "unitName",
            header: t("voting:delegations.table.unit"),
            enableSorting: true,
            sortingFn: "localeNumeric",
            enableGlobalFilter: true,
            cell: ({ row }) => (
                <span className="text-foreground truncate text-sm font-semibold">
                    {row.original.unitName}
                </span>
            ),
        },
        {
            id: "from",
            accessorKey: "fromOwnerName",
            header: t("voting:delegations.table.from"),
            enableSorting: false,
            enableGlobalFilter: true,
            cell: ({ row }) => (
                <span className="text-secondary-foreground block truncate text-sm">
                    {row.original.fromOwnerName}
                </span>
            ),
        },
        {
            id: "to",
            accessorKey: "toDelegateName",
            header: t("voting:delegations.table.to"),
            enableSorting: false,
            enableGlobalFilter: true,
            cell: ({ row }) => (
                <span className="text-secondary-foreground block truncate text-sm">
                    {row.original.toDelegateName}
                </span>
            ),
        },
        {
            id: "date",
            accessorFn: (row) => new Date(row.createdAt).getTime(),
            header: t("voting:delegations.table.date"),
            enableSorting: true,
            sortDescFirst: true,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {format(new Date(row.original.createdAt), "dd.MM.yyyy")}
                </span>
            ),
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableGlobalFilter: false,
            meta: { align: "right" },
            cell: ({ row }) => (
                <Button
                    variant="tableActionDanger"
                    size="tableText"
                    className="text-destructive"
                    onClick={() => handleRevoke(row.original.id)}
                    disabled={isRevoking}
                >
                    {t("voting:delegations.table.revoke")}
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={filteredConsents}
                gridTemplate="1fr 1.3fr 1.3fr 0.9fr 110px"
                isLoading={isLoading}
                loadingMessage={t("common:loading")}
                emptyMessage={t("voting:delegations.empty.filtered")}
                emptySearchMessage={t("voting:delegations.empty.search")}
                searchPlaceholder={t(
                    "voting:delegations.table.searchPlaceholder",
                )}
                initialSorting={[{ id: "date", desc: true }]}
                countLabel={(info) =>
                    info.paginated
                        ? t("voting:delegations.table.range", {
                              from: info.from,
                              to: info.to,
                              total: info.total,
                          })
                        : t("voting:delegations.table.count", {
                              count: info.total,
                          })
                }
                paginationLabels={{
                    previous: t("common:pagination.previous"),
                    next: t("common:pagination.next"),
                }}
                toolbarEnd={
                    <div className="w-full max-w-[240px]">
                        <Select
                            value={effectiveSelectedVoteId}
                            onValueChange={setSelectedVoteId}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue
                                    placeholder={t(
                                        "voting:delegations.filter.vote",
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {scheduledVotes.map((vote) => (
                                    <SelectItem key={vote.id} value={vote.id}>
                                        {vote.title}
                                        {vote.scheduledFrom && (
                                            <span className="ml-2 text-xs text-slate-400">
                                                {format(
                                                    new Date(
                                                        vote.scheduledFrom,
                                                    ),
                                                    "dd.MM.yyyy",
                                                )}
                                            </span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
            />
            <p className="text-muted-foreground text-sm">
                {t("voting:delegations.footnote")}
            </p>
        </div>
    );
}
