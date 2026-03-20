import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
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
                    v.status === "SCHEDULED" &&
                    voteIdsWithConsents.has(v.id) &&
                    !v.allowCoOwnerIndividualVote,
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

    if (isLoading) {
        return (
            <div className="py-8 text-center text-slate-500">
                {t("common:loading")}
            </div>
        );
    }

    if (!consents || consents.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center text-slate-500">
                {t("voting:delegations.empty.all")}
            </div>
        );
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

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <div className="w-full max-w-xs">
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
                                                new Date(vote.scheduledFrom),
                                                "dd.MM.yyyy",
                                            )}
                                        </span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                {t("voting:delegations.table.unit")}
                            </TableHead>
                            <TableHead>
                                {t("voting:delegations.table.from")}
                            </TableHead>
                            <TableHead>
                                {t("voting:delegations.table.to")}
                            </TableHead>
                            <TableHead>
                                {t("voting:delegations.table.date")}
                            </TableHead>
                            <TableHead className="text-right">
                                {t("voting:delegations.table.actions")}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredConsents.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-12 text-center text-slate-500"
                                >
                                    {t("voting:delegations.empty.filtered")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredConsents.map((consent) => (
                                <TableRow key={consent.id}>
                                    <TableCell className="font-medium text-slate-900">
                                        {consent.unitName}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {consent.fromOwnerName}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {consent.toDelegateName}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500">
                                        {format(
                                            new Date(consent.createdAt),
                                            "dd.MM.yyyy",
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                            onClick={() =>
                                                handleRevoke(consent.id)
                                            }
                                            disabled={isRevoking}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
