import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronDown, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@hoa-mngr/ui";

import type { OwningUnitStatusDto } from "@/api/generated/model";
import {
    getVotesControllerGetVoterStatusQueryOptions,
    useVotesControllerGetVotes,
} from "@/api/generated/votes/votes";

import {
    votesDelegableByMember,
    votesOpenForDelegation,
} from "../../utils/delegation-eligibility";

/**
 * Starts a delegation from the delegations tab instead of from a vote detail.
 *
 * Members who have never delegated anything had no way in from here — the
 * delegation list is empty for them, so the tab told them nothing about where
 * to begin. Picking a vote lands on exactly the screen the vote detail links
 * to, so the two entry points stay one flow.
 */
export function CreateDelegationMenu() {
    const { t } = useTranslation(["voting"]);
    const navigate = useNavigate();

    const { data: votes, isLoading: isLoadingVotes } =
        useVotesControllerGetVotes();

    // Which votes to offer depends on the member's own units, which only the
    // per-vote voter status carries. Scheduled votes are few, so asking for
    // each is cheaper than a filter that guesses and sends them to a screen
    // with nothing to select.
    const scheduledVotes = votesOpenForDelegation(votes);
    const voterStatuses = useQueries({
        queries: scheduledVotes.map((vote) =>
            getVotesControllerGetVoterStatusQueryOptions(vote.id),
        ),
    });

    const isLoadingStatuses = voterStatuses.some((q) => q.isLoading);

    // `useQueries` answers in the order it was asked, so each result lines up
    // with the vote at the same index.
    const owningUnitsByVoteId = new Map<string, OwningUnitStatusDto[]>();
    scheduledVotes.forEach((vote, index) => {
        const units = voterStatuses[index]?.data?.owningUnits;
        if (units) owningUnitsByVoteId.set(vote.id, units);
    });

    const delegableVotes = votesDelegableByMember(votes, owningUnitsByVoteId);
    const isLoading = isLoadingVotes || isLoadingStatuses;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={isLoading}>
                    <UserPlus />
                    {t("voting:delegations.create.button")}
                    <ChevronDown />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[16rem]">
                {delegableVotes.length === 0 ? (
                    // Kept as a disabled line rather than hiding the button:
                    // a member who finds nothing here needs to be told why,
                    // not left looking for a control that isn't there.
                    <DropdownMenuItem disabled>
                        {t("voting:delegations.create.noVotes")}
                    </DropdownMenuItem>
                ) : (
                    delegableVotes.map((vote) => (
                        <DropdownMenuItem
                            key={vote.id}
                            className="cursor-pointer"
                            onSelect={() =>
                                navigate(`/voting/${vote.id}/delegate`)
                            }
                        >
                            <span className="truncate">{vote.title}</span>
                            {vote.scheduledFrom && (
                                <span className="text-muted-foreground ml-auto pl-3 text-xs">
                                    {format(
                                        new Date(vote.scheduledFrom),
                                        "dd.MM.yyyy",
                                    )}
                                </span>
                            )}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
