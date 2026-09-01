import { ArrowRight, Home, Info, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    StatusChip,
    type StatusChipVariant,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import {
    OwnedUnitResponseDtoPartyType,
    type OwningUnitStatusDtoStatus,
    type VoteDetailResponseDto,
} from "@/api/generated/model";
import { useUnitControllerGetMyOwnedUnits } from "@/api/generated/property-units/property-units";
import { useVotesControllerGetVoterStatus } from "@/api/generated/votes/votes";

import { formatTotalVotingPower } from "../utils/total-voting-power";

interface VoterStatusSidebarProps {
    vote: VoteDetailResponseDto;
}

// Icon tile tone: READY/VOTED read as "good", REQUIRES_DELEGATION/DELEGATED
// as "needs attention" (even once delegated, the unit isn't voting directly),
// INELIGIBLE fades out.
const STATUS_ICON_TILE: Record<OwningUnitStatusDtoStatus, string> = {
    READY: "bg-success-muted text-success-tint-foreground",
    VOTED: "bg-success-muted text-success-tint-foreground",
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
    REQUIRES_DELEGATION: "warning",
    DELEGATED: "neutral",
    INELIGIBLE: "neutral",
};

const STATUS_LABEL_KEY = {
    READY: "detail.statusSidebar.statusReady",
    VOTED: "detail.statusSidebar.statusVoted",
    REQUIRES_DELEGATION: "detail.statusSidebar.statusDelegation",
    DELEGATED: "detail.statusSidebar.statusDelegated",
    INELIGIBLE: "detail.statusSidebar.statusIneligible",
} as const satisfies Record<OwningUnitStatusDtoStatus, string>;

export function VoterStatusSidebar({ vote }: VoterStatusSidebarProps) {
    const { t } = useTranslation(["voting"]);
    const voteId = vote.id;

    const statusQuery = useVotesControllerGetVoterStatus(voteId, {
        query: {
            // `vote.id` is always defined here; kept as a defensive guard.
            enabled: !!voteId,
        },
    });

    // Separate, vote-independent endpoint (Task 3) that's the only place
    // carrying `partyType` — the voter-status DTO's owningUnits don't have
    // it. Deliberately not folded into the loading/error gates below: this
    // is only needed for one supplementary sentence (SJM second-spouse
    // hint), so an unrelated failure/slow load here must not blank the
    // whole status card. `.data` is read optionally further down instead.
    const ownedUnitsQuery = useUnitControllerGetMyOwnedUnits();

    if (statusQuery.isLoading) {
        return (
            <div className="border-hairline bg-card rounded-card flex h-64 items-center justify-center border">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
        );
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
                            {unit.status === "INELIGIBLE" ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="shrink-0">
                                            <StatusChip
                                                variant={
                                                    STATUS_BADGE_VARIANT[
                                                        unit.status
                                                    ]
                                                }
                                                className="cursor-help"
                                            >
                                                {t(
                                                    STATUS_LABEL_KEY[
                                                        unit.status
                                                    ],
                                                )}
                                                {unit.ineligibleReason && (
                                                    <Info className="h-3.5 w-3.5 opacity-70" />
                                                )}
                                            </StatusChip>
                                        </span>
                                    </TooltipTrigger>
                                    {unit.ineligibleReason && (
                                        <TooltipContent>
                                            {t(
                                                `detail.statusSidebar.ineligibleReasons.${unit.ineligibleReason}`,
                                            )}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            ) : (
                                <StatusChip
                                    variant={STATUS_BADGE_VARIANT[unit.status]}
                                    className="shrink-0"
                                >
                                    {t(STATUS_LABEL_KEY[unit.status])}
                                </StatusChip>
                            )}
                        </div>
                    ))}

                    {unitRequiringDelegation && (
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

            <p className="text-muted-foreground px-1 text-sm">
                {t("detail.statusSidebar.help.description")}{" "}
                <a
                    href="#"
                    className="text-primary font-medium hover:underline"
                >
                    {t("detail.statusSidebar.help.contact")}
                </a>
            </p>
        </div>
    );
}
