import type { TFunction } from "i18next";

import { VoteListItemResponseDto } from "@/api/generated/model";

export type VoteStatusLineTone = "destructive" | "warning" | "muted";

export interface VoteStatusResolution {
    line: { text: string; tone: VoteStatusLineTone } | null;
    action: {
        to: string;
        label: string;
        variant?: "default" | "outline";
    };
}

/**
 * Resolves the personal status line and call-to-action for a vote card,
 * based on the vote's status and the current member's voter summary.
 *
 * Kept as a plain function (not a component) rather than the previous
 * `VoteStatusSection` JSX component: the new card layout needs the status
 * line inside the card's text column and the action button pinned to the
 * card's right edge, which are two different places in the DOM tree — a
 * single component call can't render into both. `VoteCard` is the only
 * caller and owns the layout; this only owns the per-status branching.
 */
export function resolveVoteStatus(
    vote: VoteListItemResponseDto,
    t: TFunction<"voting">,
): VoteStatusResolution {
    const summary = vote.voterSummary;

    if (vote.status === "OPEN") {
        if (summary?.hasVoted) {
            return {
                line: { text: t("list.card.votedSubtitle"), tone: "muted" },
                action: {
                    to: `/voting/${vote.id}`,
                    label: t("list.card.alreadyVotedAction"),
                    variant: "outline",
                },
            };
        }
        if (summary?.canVote) {
            return {
                line: {
                    text: t("list.card.voteRequired"),
                    tone: "destructive",
                },
                action: {
                    to: `/voting/${vote.id}`,
                    label: t("list.card.voteAction"),
                },
            };
        }
        if (summary?.isDelegated) {
            return {
                line: {
                    text: t("list.card.alreadyDelegatedOpenSubtitle"),
                    tone: "muted",
                },
                action: {
                    to: `/voting/${vote.id}`,
                    label: t("list.card.viewDetails"),
                    variant: "outline",
                },
            };
        }
        return {
            line: {
                text: t("list.card.cannotVoteOpenSubtitle"),
                tone: "muted",
            },
            action: {
                to: `/voting/${vote.id}`,
                label: t("list.card.viewDetails"),
                variant: "outline",
            },
        };
    }

    if (vote.status === "SCHEDULED") {
        if (summary?.requiresDelegation) {
            return {
                line: {
                    text: t("list.card.delegationNeededSubtitle"),
                    tone: "warning",
                },
                action: {
                    to: `/voting/${vote.id}/delegate`,
                    label: t("list.card.manageDelegation"),
                    variant: "outline",
                },
            };
        }
        if (summary?.canVote) {
            return {
                line: {
                    text: t("list.card.readyToVoteSubtitle"),
                    tone: "muted",
                },
                action: {
                    to: `/voting/${vote.id}`,
                    label: t("list.card.viewDetails"),
                    variant: "outline",
                },
            };
        }
        if (summary?.isDelegated) {
            return {
                line: {
                    text: t("list.card.alreadyDelegatedSubtitle"),
                    tone: "muted",
                },
                action: {
                    to: `/voting/${vote.id}`,
                    label: t("list.card.viewDetails"),
                    variant: "outline",
                },
            };
        }
        return {
            line: { text: t("list.card.scheduledSubtitle"), tone: "muted" },
            action: {
                to: `/voting/${vote.id}`,
                label: t("list.card.viewDetails"),
                variant: "outline",
            },
        };
    }

    if (vote.status === "DRAFT") {
        return {
            line: { text: t("list.card.editDraft"), tone: "muted" },
            action: {
                to: `/voting/${vote.id}/edit`,
                label: t("hub.continueEditing"),
                variant: "outline",
            },
        };
    }

    // Fallback (e.g. CLOSED). The hub's Results tab renders closed votes
    // with its own row markup and doesn't use VoteCard, but this keeps a
    // sane default in case VoteCard is ever reused for a closed vote.
    return {
        line: { text: t("list.card.viewOutcomes"), tone: "muted" },
        action: {
            to: `/voting/${vote.id}/results`,
            label: t("list.card.viewResults"),
            variant: "outline",
        },
    };
}
