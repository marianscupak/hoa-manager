import { format, formatDistanceToNow, isPast } from "date-fns";
import { cs, enUS, type Locale } from "date-fns/locale";
import type { TFunction } from "i18next";
import { useAtomValue } from "jotai";
import { ArrowLeft, BarChart2, Edit2, Loader2, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";

import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@hoa-mngr/ui";

import { type VoteDetailResponseDto } from "@/api/generated/model";
import {
    useVotesControllerGetVoteDetail,
    useVotesControllerGetVoteTurnout,
} from "@/api/generated/votes/votes";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";

import { DeleteDraftVoteDialog } from "../components/delete-draft-vote-dialog";
import { ScheduleValidationModal } from "../components/schedule-validation-modal";
import { StatusBadge } from "../components/status-badge";
import { VoteDetailTimeline } from "../components/vote-detail-timeline";
import { VoteDocuments } from "../components/vote-documents";
import { VoteQuestionsList } from "../components/vote-questions-list";
import { VoterStatusSidebar } from "../components/voter-status-sidebar";
import { useScheduleVote } from "../hooks/use-schedule-vote";

/**
 * Header meta line under the vote title. OPEN/CLOSED votes have concrete
 * opened+closes dates, so they get the full "Opened X · closes Y (relative)"
 * sentence — unless `scheduledTo` is already in the past (always true for
 * CLOSED, and possible for an OPEN vote whose close date has elapsed but
 * hasn't been processed yet), in which case the present-tense "closes"
 * paired with a past-tense relative ("closes ... 3 days ago") would read
 * wrong, so the relative fragment is dropped via `metaLineEnded` instead.
 * DRAFT/SCHEDULED votes haven't opened yet, so this reuses the opensIn
 * wording + relative-time behavior that used to live in the voter status
 * sidebar (now replaced there by the voting-power subtitle).
 */
function buildMetaLine(
    vote: VoteDetailResponseDto,
    t: TFunction<"voting">,
    locale: Locale,
): string | null {
    if (vote.status === "DRAFT" || vote.status === "SCHEDULED") {
        if (vote.scheduledFrom && !isPast(new Date(vote.scheduledFrom))) {
            return `${t("detail.statusSidebar.opensIn")} ${formatDistanceToNow(
                new Date(vote.scheduledFrom),
                { locale, addSuffix: true },
            )}`;
        }
        return null;
    }

    if (!vote.scheduledFrom || !vote.scheduledTo) return null;

    const opened = format(new Date(vote.scheduledFrom), "d. M. yyyy HH:mm");
    const closes = format(new Date(vote.scheduledTo), "d. M. yyyy HH:mm");

    if (isPast(new Date(vote.scheduledTo))) {
        return t("detail.metaLineEnded", { opened, closes });
    }

    return t("detail.metaLine", {
        opened,
        closes,
        relative: formatDistanceToNow(new Date(vote.scheduledTo), {
            locale,
            addSuffix: true,
        }),
    });
}

export function VoteDetailPage() {
    const { t, i18n } = useTranslation(["voting", "dashboard"]);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const tenantCtx = useAtomValue(tenantContextAtom);
    const locale = i18n.language === "cs" ? cs : enUS;

    const isAdmin = isAdminOrBoard(tenantCtx?.roles);

    const voteQuery = useVotesControllerGetVoteDetail(id ?? "", {
        query: {
            enabled: !!id,
        },
    });

    const turnoutQuery = useVotesControllerGetVoteTurnout(id ?? "", {
        query: {
            enabled: !!id && isAdmin && voteQuery.data?.status === "OPEN",
        },
    });

    const {
        handleSchedule,
        isConfirmOpen,
        setIsConfirmOpen,
        isValidationOpen,
        setIsValidationOpen,
        validationErrors,
        isPending,
    } = useScheduleVote(id ?? "", {
        onSuccess: () => {
            voteQuery.refetch();
        },
    });

    const handleEdit = () => {
        navigate(`/voting/${id}/edit`);
    };

    if (voteQuery.isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (voteQuery.isError || !voteQuery.data) {
        return (
            <div className="text-destructive p-8 text-center">
                {t("voting:list.error")}
            </div>
        );
    }

    const vote = voteQuery.data;
    const metaLine = buildMetaLine(vote, t, locale);
    const showTurnoutLine =
        isAdmin && vote.status === "OPEN" && !!turnoutQuery.data;

    return (
        <div className="flex flex-col gap-6">
            <Link
                to="/voting"
                className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("voting:detail.backToVoting")}
            </Link>

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-3xl font-black tracking-tight">
                            {vote.title}
                        </h1>
                        <StatusBadge status={vote.status} />
                    </div>
                    {metaLine && (
                        <p className="text-muted-foreground mt-2 text-sm">
                            {metaLine}
                        </p>
                    )}
                    {showTurnoutLine && turnoutQuery.data && (
                        <p className="text-muted-foreground mt-1 text-sm">
                            {t("dashboard:featuredVote.turnoutLine", {
                                voted: turnoutQuery.data.participationUnitCount,
                                total: turnoutQuery.data.denominatorUnitCount,
                            })}
                        </p>
                    )}
                </div>

                {isAdmin && vote.status === "DRAFT" && (
                    <div className="flex flex-wrap gap-3">
                        <DeleteDraftVoteDialog voteId={vote.id} />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEdit}
                        >
                            <Edit2 />
                            {t("voting:detail.actions.edit")}
                        </Button>
                        <Dialog
                            open={isConfirmOpen}
                            onOpenChange={setIsConfirmOpen}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Send />
                                    {t("voting:detail.actions.schedule")}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {t(
                                            "voting:detail.actions.scheduleConfirmTitle",
                                        )}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t(
                                            "voting:detail.actions.scheduleConfirmDescription",
                                        )}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsConfirmOpen(false)}
                                    >
                                        {t("voting:detail.actions.cancel")}
                                    </Button>
                                    <Button
                                        onClick={handleSchedule}
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <Loader2 className="animate-spin" />
                                        ) : null}
                                        {t("voting:detail.actions.confirm")}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {vote.status === "CLOSED" && (
                    <Button
                        size="sm"
                        onClick={() => navigate(`/voting/${id}/results`)}
                    >
                        <BarChart2 />
                        {t("voting:results.viewResults")}
                    </Button>
                )}
            </div>

            <ScheduleValidationModal
                open={isValidationOpen}
                onOpenChange={setIsValidationOpen}
                errors={validationErrors}
                voteId={id ?? ""}
                isAlreadyOnEditPage={false}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
                <div className="flex min-w-0 flex-col gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-muted-foreground text-[13px] font-semibold tracking-wide uppercase">
                                {t("voting:detail.about.title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 pt-0">
                            {vote.description && (
                                <p className="text-foreground/80 text-[14.5px] leading-[23px] whitespace-pre-wrap">
                                    {vote.description}
                                </p>
                            )}
                            <VoteDocuments
                                voteId={vote.id}
                                documents={vote.documents ?? []}
                                canManage={isAdmin && vote.status === "DRAFT"}
                            />
                        </CardContent>
                    </Card>

                    <VoteQuestionsList questions={vote.questions} />

                    <VoteDetailTimeline
                        scheduledFrom={vote.scheduledFrom ?? null}
                        scheduledTo={vote.scheduledTo ?? null}
                    />
                </div>

                <div>
                    <VoterStatusSidebar vote={vote} />
                </div>
            </div>
        </div>
    );
}
