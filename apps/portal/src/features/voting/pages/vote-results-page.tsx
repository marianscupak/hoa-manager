import { format } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { useAtomValue } from "jotai";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import {
    type SetVoteRulesetResponseDto,
    type VoteDetailResponseDto,
    type VoteResultsResponseDto,
} from "@/api/generated/model";
import {
    useVotesControllerGetVoteDetail,
    useVotesControllerGetVoteResults,
} from "@/api/generated/votes/votes";
import { tenantContextAtom } from "@/auth/atoms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hoa-mngr/ui";

import { VoteActivityTab } from "../components/activity/vote-activity-tab";
import { AuditExportButton } from "../components/audit-export-button";
import { ModeBadge } from "../components/mode-badge";
import { ParticipationBanner } from "../components/results/participation-banner";
import { VerdictCard } from "../components/results/verdict-card";
import { StatusBadge } from "../components/status-badge";

type EnrichedQuestion = VoteResultsResponseDto["questionResults"][number] & {
    title: string;
    type?: string;
    // Threaded through so VerdictCard can read the actual majorityRuleType
    // for its reason sentence instead of inferring simple-vs-qualified from
    // majorityThreshold num/den + majorityComparator. These numeric fields are
    // set to null whenever there's no winner (tie) or a zero denominator,
    // regardless of rule type, so they can't be trusted alone for a legally
    // meaningful sentence.
    effectiveRuleset?: SetVoteRulesetResponseDto | null;
};

type ActiveTab = "results" | "activity";

function buildOptionLabelMap(
    vote: VoteDetailResponseDto,
): Record<string, { label: string; optionKey: string }> {
    const map: Record<string, { label: string; optionKey: string }> = {};
    for (const q of vote.questions) {
        for (const opt of q.options) {
            map[opt.id] = { label: opt.label, optionKey: opt.optionKey };
        }
    }
    return map;
}

function buildEnrichedQuestions(
    vote: VoteDetailResponseDto,
    results: VoteResultsResponseDto,
): EnrichedQuestion[] {
    return results.questionResults.map((qr) => {
        const question = vote.questions.find((q) => q.id === qr.questionId);
        return {
            ...qr,
            title: question?.title ?? qr.questionId,
            type: question?.type,
            effectiveRuleset: question?.effectiveRuleset,
        };
    });
}

export function VoteResultsPage() {
    const { t, i18n } = useTranslation(["voting"]);
    const { id } = useParams<{ id: string }>();
    const tenantCtx = useAtomValue(tenantContextAtom);
    const locale = i18n.language === "cs" ? cs : enUS;

    const canExportAudit =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER") ||
        tenantCtx?.roles.includes("AUDITOR");

    const [activeTab, setActiveTab] = useState<ActiveTab>("results");
    const [activityTouched, setActivityTouched] = useState(false);

    const handleTabChange = (value: string) => {
        const next = value as ActiveTab;
        setActiveTab(next);
        if (next === "activity") setActivityTouched(true);
    };

    const detailQuery = useVotesControllerGetVoteDetail(id ?? "", {
        query: { enabled: !!id },
    });

    const resultsQuery = useVotesControllerGetVoteResults(id ?? "", {
        query: { enabled: !!id },
    });

    const isLoading = detailQuery.isLoading || resultsQuery.isLoading;
    const isError =
        detailQuery.isError ||
        resultsQuery.isError ||
        !detailQuery.data ||
        !resultsQuery.data;

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-destructive p-8 text-center">
                {t("voting:list.error")}
            </div>
        );
    }

    const vote = detailQuery.data;
    const results = resultsQuery.data;

    const enrichedQuestions = buildEnrichedQuestions(vote, results);
    const optionLabelMap = buildOptionLabelMap(vote);

    const ranLine =
        vote.scheduledFrom && vote.scheduledTo && results.computedAt
            ? t("voting:resultsV2.ranLine", {
                  from: format(new Date(vote.scheduledFrom), "d. M. yyyy", {
                      locale,
                  }),
                  to: format(new Date(vote.scheduledTo), "d. M. yyyy", {
                      locale,
                  }),
                  computed: format(
                      new Date(results.computedAt),
                      "d. M. yyyy HH:mm",
                      { locale },
                  ),
              })
            : null;

    return (
        <div className="flex flex-col gap-6">
            <Link
                to="/voting"
                className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("voting:results.breadcrumbVoting")}
            </Link>

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-3xl font-black tracking-tight">
                            {vote.title}
                        </h1>
                        <StatusBadge status={vote.status} />
                        <ModeBadge mode={vote.mode} />
                    </div>
                    {ranLine && (
                        <p className="text-muted-foreground mt-2 text-sm">
                            {ranLine}
                        </p>
                    )}
                </div>
                {canExportAudit && id && <AuditExportButton voteId={id} />}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="results">
                        {t("voting:results.tabs.results")}
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                        {t("voting:results.tabs.activity")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="flex flex-col gap-5">
                    <ParticipationBanner
                        results={results}
                        ruleset={vote.ruleset}
                    />

                    {enrichedQuestions.map((q, i) => (
                        <VerdictCard
                            key={q.questionId}
                            index={i + 1}
                            question={q}
                            results={results}
                            optionLabels={optionLabelMap}
                            ruleset={vote.ruleset}
                        />
                    ))}

                    <p className="text-muted-foreground text-[12.5px]">
                        {t("voting:resultsV2.footnote")}
                    </p>
                </TabsContent>

                <TabsContent value="activity">
                    {id && activityTouched && (
                        <VoteActivityTab
                            voteId={id}
                            enabled={activityTouched}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
