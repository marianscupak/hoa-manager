import { useAtomValue } from "jotai";
import { ArrowRight, BarChart2, FileText, Home, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    Skeleton,
    StatusChip,
    type StatusChipVariant,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import {
    OwnedUnitResponseDtoPartyType,
    type OwningUnitStatusDto,
    type OwningUnitStatusDtoStatus,
    type VoteDetailResponseDto,
} from "@/api/generated/model";
import { useUnitControllerGetMyOwnedUnits } from "@/api/generated/property-units/property-units";
import { useMemberControllerGetContacts } from "@/api/generated/tenant-members/tenant-members";
import {
    useVotesControllerGetVoterStatus,
    useVotesControllerGetVoteTurnout,
} from "@/api/generated/votes/votes";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";

import { buildContactMailto } from "../utils/contact-mailto";
import { delegationPrompt } from "../utils/delegation-eligibility";
import { formatTotalVotingPower } from "../utils/total-voting-power";

interface VoterStatusSidebarProps {
    vote: VoteDetailResponseDto;
}

// Icon tile tone: READY/VOTED read as "good", PROXY as a unit that is this
// member's to cast but not theirs to own, REQUIRES_DELEGATION/DELEGATED as
// "needs attention" (even once delegated, the unit isn't voting directly),
// INELIGIBLE fades out.
const STATUS_ICON_TILE: Record<OwningUnitStatusDtoStatus, string> = {
    READY: "bg-success-muted text-success-tint-foreground",
    VOTED: "bg-success-muted text-success-tint-foreground",
    PROXY: "bg-primary-tint text-primary-tint-foreground",
    REQUIRES_DELEGATION: "bg-warning-muted text-warning-tint-foreground",
    DELEGATED: "bg-warning-muted text-warning-tint-foreground",
    INELIGIBLE: "bg-muted text-faint",
};

const STATUS_BADGE_VARIANT: Record<
    OwningUnitStatusDtoStatus,
    StatusChipVariant
> = {
    READY: "success",
    VOTED: "success",
    PROXY: "primary",
    REQUIRES_DELEGATION: "warning",
    DELEGATED: "neutral",
    INELIGIBLE: "neutral",
};

const STATUS_LABEL_KEY = {
    READY: "detail.statusSidebar.statusReady",
    VOTED: "detail.statusSidebar.statusVoted",
    PROXY: "detail.statusSidebar.statusProxy",
    REQUIRES_DELEGATION: "detail.statusSidebar.statusDelegation",
    DELEGATED: "detail.statusSidebar.statusDelegated",
    INELIGIBLE: "detail.statusSidebar.statusIneligible",
} as const satisfies Record<OwningUnitStatusDtoStatus, string>;

/**
 * A unit's status chip, with an explanation on the statuses that need one:
 * why a unit cannot vote, and — for a unit held on someone else's behalf —
 * where the right to cast it came from.
 */
function UnitStatusChip({ unit }: { unit: OwningUnitStatusDto }) {
    const { t } = useTranslation(["voting"]);

    const explanation =
        unit.status === "INELIGIBLE"
            ? unit.ineligibleReason &&
              t(
                  `detail.statusSidebar.ineligibleReasons.${unit.ineligibleReason}`,
              )
            : unit.status === "PROXY"
              ? t("detail.statusSidebar.statusProxyHint")
              : null;

    const chip = (
        <StatusChip
            variant={STATUS_BADGE_VARIANT[unit.status]}
            className={cn("shrink-0", explanation && "cursor-help")}
        >
            {t(STATUS_LABEL_KEY[unit.status])}
            {explanation && <Info className="h-3.5 w-3.5 opacity-70" />}
        </StatusChip>
    );

    if (!explanation) return chip;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="shrink-0">{chip}</span>
            </TooltipTrigger>
            <TooltipContent>{explanation}</TooltipContent>
        </Tooltip>
    );
}

export function VoterStatusSidebar({ vote }: VoterStatusSidebarProps) {
    const { t } = useTranslation(["voting"]);
    const voteId = vote.id;
    const tenantCtx = useAtomValue(tenantContextAtom);
    const isAdmin = isAdminOrBoard(tenantCtx?.roles);

    const statusQuery = useVotesControllerGetVoterStatus(voteId, {
        query: {
            // `vote.id` is always defined here; kept as a defensive guard.
            enabled: !!voteId,
        },
    });

    // Turnout now feeds the all-roles Live results card as well as the
    // board-only paper-ballot prompt, so it is fetched for every member of
    // an open vote.
    const turnoutQuery = useVotesControllerGetVoteTurnout(voteId, {
        query: { enabled: vote.status === "OPEN" },
    });

    // Separate, vote-independent endpoint (Task 3) that's the only place
    // carrying `partyType` — the voter-status DTO's owningUnits don't have
    // it. Deliberately not folded into the loading/error gates below: this
    // is only needed for one supplementary sentence (SJM second-spouse
    // hint), so an unrelated failure/slow load here must not blank the
    // whole status card. `.data` is read optionally further down instead.
    const ownedUnitsQuery = useUnitControllerGetMyOwnedUnits();
    // Active admins' addresses for the "contact the chair" link below the
    // card. Optional in the same way: while loading or when nobody
    // qualifies the link is simply omitted, never rendered dead.
    const contactsQuery = useMemberControllerGetContacts();
    const contactHref = buildContactMailto(
        (contactsQuery.data ?? []).map((c) => c.email),
        vote.title,
    );

    if (statusQuery.isLoading) {
        return <Skeleton className="rounded-card h-64 w-full" />;
    }

    if (statusQuery.isError || !statusQuery.data) {
        return (
            <div className="border-hairline bg-card rounded-card flex h-64 items-center justify-center border p-6 text-center">
                <p className="text-destructive text-sm">
                    {t("voting:list.error")}
                </p>
            </div>
        );
    }

    const statusData = statusQuery.data;
    const isVoteOpen = vote.status === "OPEN";

    const prompt = delegationPrompt(vote.status, statusData.owningUnits);
    const unitRequiringDelegation = statusData.owningUnits.find(
        (u) => u.status === "REQUIRES_DELEGATION",
    );
    // The SJM second-spouse hint only applies when the flagged unit is
    // itself held in marital community property. `ownedUnitsQuery.data`
    // may still be loading/absent (see the comment above) — that just
    // means the hint is omitted, not that the whole card breaks.
    const isSjmDelegationUnit = !!ownedUnitsQuery.data?.some(
        (u) =>
            u.id === unitRequiringDelegation?.id &&
            u.partyType === OwnedUnitResponseDtoPartyType.SJM,
    );

    return (
        <div className="flex flex-col gap-4">
            <Card className="overflow-hidden">
                <CardHeader className="border-hairline border-b">
                    <CardTitle>{t("detail.statusSidebar.title")}</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        {t("detail.statusSidebar.totalPower")}{" "}
                        <span className="text-foreground font-semibold">
                            {formatTotalVotingPower(
                                statusData.totalVotingPower,
                                vote.ruleset?.weightBasis,
                                t,
                            )}
                        </span>
                    </p>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 pt-4">
                    {statusData.owningUnits.map((unit) => (
                        <div key={unit.id} className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "rounded-tile flex h-10 w-10 shrink-0 items-center justify-center",
                                    STATUS_ICON_TILE[unit.status],
                                )}
                            >
                                <Home className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                    {unit.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {t("detail.statusSidebar.share")}{" "}
                                    {unit.share}
                                </p>
                            </div>
                            <UnitStatusChip unit={unit} />
                        </div>
                    ))}

                    {prompt === "required" && (
                        <div className="rounded-panel border-warning-tint-border bg-warning-muted border p-3">
                            <p className="text-warning-deep text-sm leading-[19px]">
                                {t("status.requiresDelegation")}
                            </p>
                            {isSjmDelegationUnit && (
                                <p className="text-warning-deep mt-1.5 text-sm leading-[19px]">
                                    {t("status.requiresDelegationSjm")}
                                </p>
                            )}
                            <Link
                                to={`/voting/${voteId}/delegate`}
                                className="text-primary-tint-foreground mt-1.5 inline-block text-sm font-semibold hover:underline"
                            >
                                {t("detail.statusSidebar.manageDelegation")} →
                            </Link>
                        </div>
                    )}

                    {prompt === "available" && (
                        <div className="rounded-panel border-hairline bg-muted/40 border p-3">
                            <p className="text-muted-foreground text-sm leading-[19px]">
                                {t("status.readyCanDelegate")}
                            </p>
                            <Link
                                to={`/voting/${voteId}/delegate`}
                                className="text-primary-tint-foreground mt-1.5 inline-block text-sm font-semibold hover:underline"
                            >
                                {t("detail.statusSidebar.arrangeDelegation")} →
                            </Link>
                        </div>
                    )}
                </CardContent>

                {isVoteOpen && (
                    <CardFooter className="border-hairline flex flex-col gap-2 border-t pt-4">
                        <Button
                            size="lg"
                            disabled={!statusData.canVote}
                            asChild={statusData.canVote}
                            className="w-full"
                        >
                            {statusData.canVote ? (
                                <Link to={`/voting/${voteId}/cast`}>
                                    {t("detail.statusSidebar.voteButton")}
                                    <ArrowRight />
                                </Link>
                            ) : statusData.owningUnits.some(
                                  (u) => u.status === "VOTED",
                              ) ? (
                                t("detail.statusSidebar.alreadyVotedButton")
                            ) : (
                                t("detail.statusSidebar.voteButton")
                            )}
                        </Button>
                        <p className="text-muted-foreground text-center text-xs">
                            {t("detail.statusSidebar.ballotsFinal")}
                        </p>
                    </CardFooter>
                )}
            </Card>

            {vote.status === "OPEN" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                            {t("voting:liveResults.entry.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {/* Turnout is a separate fetch from the vote itself, so
                        it can still be loading (or have failed) when this
                        card first paints — show a placeholder rather than
                        the `?? 0` fallback presenting a guess as a real
                        count. The title and link above/below don't depend on
                        it and stay visible either way. */}
                        {turnoutQuery.isLoading ? (
                            <Skeleton className="h-4 w-48" />
                        ) : (
                            turnoutQuery.data && (
                                <p className="text-muted-foreground text-sm">
                                    {t(
                                        // `quorumMet` is `boolean | null`:
                                        // `null` means the vote has no quorum
                                        // concept (PER_ROLLAM) and uses the
                                        // quorum-agnostic copy; `true`/`false`
                                        // are both worth stating explicitly —
                                        // "not reached yet" is the case a
                                        // board most wants surfaced here.
                                        turnoutQuery.data.quorumMet === null
                                            ? "voting:liveResults.entry.copy"
                                            : turnoutQuery.data.quorumMet
                                              ? "voting:liveResults.entry.copyQuorum"
                                              : "voting:liveResults.entry.copyQuorumNotReached",
                                        {
                                            voted: turnoutQuery.data
                                                .participationUnitCount,
                                            total: turnoutQuery.data
                                                .totalVotesUnitCount,
                                        },
                                    )}
                                </p>
                            )
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" size="sm" asChild>
                            <Link to={`/voting/${voteId}/live-results`}>
                                <BarChart2 />
                                {t("voting:liveResults.entry.action")}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {isAdmin && vote.status === "OPEN" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                            {t("voting:paperBallot.boardTools.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-muted-foreground text-sm">
                            {t("voting:paperBallot.boardTools.prompt")}
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" size="sm" asChild>
                            <Link to={`/voting/${voteId}/paper-ballot`}>
                                <FileText />
                                {t("voting:paperBallot.boardTools.action")}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <p className="text-muted-foreground px-1 text-sm">
                {t("detail.statusSidebar.help.description")}
                {contactHref && (
                    <>
                        {" "}
                        <a
                            href={contactHref}
                            className="text-primary focus-visible:ring-ring rounded-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            {t("detail.statusSidebar.help.contact")}
                        </a>
                    </>
                )}
            </p>
        </div>
    );
}
