import type { TFunction } from "i18next";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    SetVoteRulesetResponseDtoMajorityRuleType,
    SetVoteRulesetResponseDtoQuorumMeasure,
    VoteOptionResponseDtoOptionKey,
    VoteQuestionResponseDtoType,
    type SetVoteRulesetResponseDto,
    type VoteOptionResponseDto,
    type VoteOptionResultDto,
    type VoteResultsResponseDto,
} from "@/api/generated/model";
import { Badge, type BadgeProps, Card } from "@hoa-mngr/ui";

import {
    mapQuestionVerdict,
    type QuestionVerdict,
} from "../../utils/question-verdict";
import { buildMajorityFragment } from "../../utils/rule-sentence";
import { computeParticipationStats } from "./participation-banner";

type EnrichedQuestion = VoteResultsResponseDto["questionResults"][number] & {
    title: string;
    type?: string;
    effectiveRuleset?: SetVoteRulesetResponseDto | null;
};

type OptionLabelMap = Record<string, { label: string; optionKey: string }>;

interface VerdictCardProps {
    index: number;
    question: EnrichedQuestion;
    results: VoteResultsResponseDto;
    optionLabels: OptionLabelMap;
    /**
     * Not in Task 20's originally listed prop shape, but required for the
     * reasonNoQuorum sentence (turnout/threshold) and unavoidable: quorum
     * threshold + measure live on the vote's ruleset, not on
     * VoteResultsResponseDto. Mirrors ParticipationBanner's `ruleset` prop
     * so both surfaces derive turnout identically. Flagged in task report.
     */
    ruleset: SetVoteRulesetResponseDto | null | undefined;
}

function verdictBadgeVariant(verdict: QuestionVerdict): BadgeProps["variant"] {
    switch (verdict) {
        case "approved":
            return "successTint";
        case "rejected":
            return "destructiveTint";
        case "winner":
            return "primaryTint";
        case "notDecided":
        default:
            return "warningTint";
    }
}

function verdictLabel(
    verdict: QuestionVerdict,
    winningOption: VoteOptionResponseDto | null,
    t: TFunction<"voting">,
): string {
    switch (verdict) {
        case "approved":
            return t("outcomes.APPROVED");
        case "rejected":
            return t("outcomes.REJECTED");
        case "winner":
            return t("outcomes.winner", { option: winningOption?.label ?? "" });
        case "notDecided":
        default:
            return t("outcomes.NOT_DECIDED");
    }
}

function findOptionResultByKey(
    question: EnrichedQuestion,
    optionLabels: OptionLabelMap,
    key: string,
) {
    // Resolve per option within *this* question's own results — optionLabels
    // is a vote-wide map (every question's options keyed by option id), so
    // looking up "the YES option id" globally first would pick up whichever
    // question happens to come first in that map.
    return question.optionResults.find(
        (o) => optionLabels[o.optionId]?.optionKey === key,
    );
}

// The majority tick's threshold fraction (0-1). Prefers the result's own
// majorityThresholdValue when the server actually computed one; that field
// is null both for SIMPLE_MAJORITY (implicit 0.5) *and* whenever there's no
// winner (a tie) or a zero denominator regardless of rule type — so on a
// null value we still have to ask the effective ruleset what the real
// threshold is instead of assuming 0.5, or a tied QUALIFIED_MAJORITY
// question would draw its tick at the wrong spot.
function deriveMajorityFraction(
    question: EnrichedQuestion,
    ruleset: SetVoteRulesetResponseDto | null | undefined,
): number {
    if (question.majorityThresholdValue !== null) {
        return question.majorityThresholdValue;
    }
    const effective = question.effectiveRuleset ?? ruleset;
    if (
        effective?.majorityRuleType ===
        SetVoteRulesetResponseDtoMajorityRuleType.QUALIFIED_MAJORITY
    ) {
        return (effective.majorityThreshold ?? 50) / 100;
    }
    return 0.5;
}

function buildReason(args: {
    verdict: QuestionVerdict;
    question: EnrichedQuestion;
    results: VoteResultsResponseDto;
    optionLabels: OptionLabelMap;
    ruleset: SetVoteRulesetResponseDto | null | undefined;
    winningOption: VoteOptionResponseDto | null;
    t: TFunction<"voting">;
}): string {
    const {
        verdict,
        question,
        results,
        optionLabels,
        ruleset,
        winningOption,
        t,
    } = args;
    const majorityDenominator = question.majorityDenominatorValue;

    if (verdict === "approved" || verdict === "rejected") {
        const forResult = findOptionResultByKey(
            question,
            optionLabels,
            VoteOptionResponseDtoOptionKey.YES,
        );
        const pct =
            majorityDenominator > 0
                ? ((forResult?.voteWeight ?? 0) / majorityDenominator) * 100
                : 0;
        const majority = buildMajorityFragment(
            question.effectiveRuleset ?? ruleset,
            t,
        );
        return t(
            verdict === "approved"
                ? "resultsV2.reasonApproved"
                : "resultsV2.reasonRejected",
            { pct: pct.toFixed(1), majority },
        );
    }

    if (verdict === "winner") {
        const winnerResult = winningOption
            ? question.optionResults.find(
                  (o) => o.optionId === winningOption.id,
              )
            : undefined;
        const pct =
            majorityDenominator > 0
                ? ((winnerResult?.voteWeight ?? 0) / majorityDenominator) * 100
                : 0;
        return t("resultsV2.reasonWinner", {
            option: winningOption?.label ?? "",
            pct: pct.toFixed(1),
        });
    }

    // notDecided
    if (!results.quorumMet) {
        const { pct } = computeParticipationStats(results, ruleset);
        return t("resultsV2.reasonNoQuorum", {
            turnout: pct.toFixed(1),
            threshold: ruleset?.quorumThreshold ?? 50,
        });
    }
    return t("resultsV2.reasonNoMajority");
}

interface LegendItemProps {
    colorClass: string;
    label: string;
    pct: number;
    units: number;
    t: TFunction<"voting">;
}

function LegendItem({ colorClass, label, pct, units, t }: LegendItemProps) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-[2px] ${colorClass}`} />
            {label} {pct.toFixed(1)} % ·{" "}
            {t("results.unitCount", { count: units })}
        </span>
    );
}

interface YesNoBarsProps {
    question: EnrichedQuestion;
    results: VoteResultsResponseDto;
    optionLabels: OptionLabelMap;
    ruleset: SetVoteRulesetResponseDto | null | undefined;
    isUnitCount: boolean;
    animated: boolean;
    t: TFunction<"voting">;
}

function YesNoBars({
    question,
    results,
    optionLabels,
    ruleset,
    isUnitCount,
    animated,
    t,
}: YesNoBarsProps) {
    // A UNIT_COUNT vote counts units everywhere else on this page (headline
    // %, participation sentence), so the bars use the same axis: units over
    // the vote's unit denominator.
    const denom = isUnitCount
        ? results.denominatorUnitCount
        : results.denominatorWeight;
    const pctOf = (option: VoteOptionResultDto | undefined) => {
        if (denom <= 0) return 0;
        const value = isUnitCount
            ? option?.voteUnitCount ?? 0
            : option?.voteWeight ?? 0;
        return (value / denom) * 100;
    };

    const yes = findOptionResultByKey(
        question,
        optionLabels,
        VoteOptionResponseDtoOptionKey.YES,
    );
    const no = findOptionResultByKey(
        question,
        optionLabels,
        VoteOptionResponseDtoOptionKey.NO,
    );
    const abstain = findOptionResultByKey(
        question,
        optionLabels,
        VoteOptionResponseDtoOptionKey.ABSTAIN,
    );

    const forPct = pctOf(yes);
    const againstPct = pctOf(no);
    const abstainPct = pctOf(abstain);
    const nonePct =
        denom > 0 ? Math.max(0, 100 - forPct - againstPct - abstainPct) : 0;

    // The majority verdict is always computed server-side on vote *weights*,
    // whatever the quorum measure is. On a unit-count axis the tick would sit
    // at a position the verdict was never derived from, so it is dropped for
    // UNIT_COUNT votes; the reason sentence still states the weight basis
    // ("% of votes cast") in words.
    const showMajorityTick = !isUnitCount;
    const majorityFraction = deriveMajorityFraction(question, ruleset);
    const majorityTickPct =
        denom > 0
            ? Math.min(
                  100,
                  ((question.majorityDenominatorValue * majorityFraction) /
                      denom) *
                      100,
              )
            : 0;

    return (
        <div>
            <div className="relative">
                <div className="bg-muted flex h-3.5 overflow-hidden rounded-[7px]">
                    <div
                        className="bg-success h-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                        style={{ width: `${animated ? forPct : 0}%` }}
                    />
                    <div
                        className="bg-destructive-bar h-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                        style={{ width: `${animated ? againstPct : 0}%` }}
                    />
                    <div
                        className="h-full bg-[#cbd5e1] motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                        style={{ width: `${animated ? abstainPct : 0}%` }}
                    />
                </div>
                {showMajorityTick && (
                    <div
                        className="bg-foreground/40 absolute -top-1.5 h-[17px] w-0.5 rounded-full"
                        style={{ left: `${majorityTickPct}%` }}
                    />
                )}
            </div>
            <div className="text-secondary-foreground mt-2.5 flex flex-wrap items-center gap-4 text-[12.5px]">
                {yes && (
                    <LegendItem
                        colorClass="bg-success"
                        label={t("create.optionLabels.YES")}
                        pct={forPct}
                        units={yes.voteUnitCount}
                        t={t}
                    />
                )}
                {no && (
                    <LegendItem
                        colorClass="bg-destructive-bar"
                        label={t("create.optionLabels.NO")}
                        pct={againstPct}
                        units={no.voteUnitCount}
                        t={t}
                    />
                )}
                {abstain && (
                    <LegendItem
                        colorClass="bg-[#cbd5e1]"
                        label={t("create.optionLabels.ABSTAIN")}
                        pct={abstainPct}
                        units={abstain.voteUnitCount}
                        t={t}
                    />
                )}
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                    <span className="bg-muted ring-border h-2 w-2 rounded-[2px] ring-1" />
                    {t("resultsV2.didntVote")} {nonePct.toFixed(1)} %
                </span>
            </div>
        </div>
    );
}

interface SingleChoiceBarsProps {
    question: EnrichedQuestion;
    results: VoteResultsResponseDto;
    optionLabels: OptionLabelMap;
    winningOptionId: string | null;
    isQuorumFailed: boolean;
    isUnitCount: boolean;
    animated: boolean;
    t: TFunction<"voting">;
}

function SingleChoiceBars({
    question,
    results,
    optionLabels,
    winningOptionId,
    isQuorumFailed,
    isUnitCount,
    animated,
    t,
}: SingleChoiceBarsProps) {
    // Same axis rule as YesNoBars: unit counts over the vote's unit
    // denominator for a UNIT_COUNT vote, weights over the majority
    // denominator otherwise.
    const denom = isUnitCount
        ? results.denominatorUnitCount
        : question.majorityDenominatorValue;

    return (
        <div className="flex flex-col gap-2.5">
            {question.optionResults.map((opt) => {
                const meta = optionLabels[opt.optionId] ?? {
                    label: opt.optionId,
                    optionKey: "",
                };
                const isWinner = opt.optionId === winningOptionId;
                const value = isUnitCount ? opt.voteUnitCount : opt.voteWeight;
                const pct = denom > 0 ? (value / denom) * 100 : 0;

                return (
                    <div key={opt.optionId}>
                        <div className="mb-1 flex items-center justify-between text-[13px]">
                            <span
                                className={
                                    isWinner
                                        ? "font-semibold"
                                        : "text-secondary-foreground font-medium"
                                }
                            >
                                {meta.label}
                                {/* Verdict is vote-level: when quorum fails
                                every question is notDecided, so leading
                                option keeps its bg-primary fill (still the
                                most-voted option) but doesn't get to claim
                                "winner" — that chip would contradict the
                                Not decided badge above. */}
                                {isWinner && !isQuorumFailed && (
                                    <span className="bg-primary-tint text-primary-tint-foreground ml-1.5 rounded-[6px] px-1.5 py-0.5 text-[11px] font-semibold">
                                        {t("resultsV2.winnerChip")}
                                    </span>
                                )}
                            </span>
                            <span className="font-semibold">
                                {pct.toFixed(1)} % ·{" "}
                                {t("results.unitCount", {
                                    count: opt.voteUnitCount,
                                })}
                            </span>
                        </div>
                        <div className="bg-muted h-[9px] rounded-full">
                            <div
                                className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out ${
                                    isWinner ? "bg-primary" : "bg-faint"
                                }`}
                                style={{ width: `${animated ? pct : 0}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function VerdictCard({
    index,
    question,
    results,
    optionLabels,
    ruleset,
}: VerdictCardProps) {
    const { t } = useTranslation(["voting"]);
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setAnimated(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const isYesNo = question.type === VoteQuestionResponseDtoType.YES_NO;

    const options: VoteOptionResponseDto[] = question.optionResults.map((o) => {
        const meta = optionLabels[o.optionId];
        return {
            id: o.optionId,
            label: meta?.label ?? o.optionId,
            sortOrder: 0,
            optionKey: (meta?.optionKey ??
                VoteOptionResponseDtoOptionKey.CUSTOM) as VoteOptionResponseDtoOptionKey,
        };
    });

    const { verdict, winningOption } = mapQuestionVerdict({
        quorumMet: results.quorumMet,
        questionType:
            question.type ?? VoteQuestionResponseDtoType.SINGLE_CHOICE,
        result: question,
        options,
    });

    // Quorum measure is vote-level (spec §3), so this deliberately reads the
    // vote's ruleset and never the question's effectiveRuleset — a majority
    // override must not flip the axis the bars are drawn on.
    const isUnitCount =
        ruleset?.quorumMeasure ===
        SetVoteRulesetResponseDtoQuorumMeasure.UNIT_COUNT;

    const isQuorumFailed = !results.quorumMet;
    const reason = buildReason({
        verdict,
        question,
        results,
        optionLabels,
        ruleset,
        winningOption,
        t,
    });

    return (
        <Card
            className={
                isQuorumFailed
                    ? "border-warning-tint-border shadow-clay-card-amber p-6"
                    : "p-6"
            }
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-primary mb-1 text-[11px] font-bold tracking-wider uppercase">
                        {t("resultsV2.resolutionLabel", { index })}
                        {!isYesNo && ` · ${t("resultsV2.multipleChoice")}`}
                    </p>
                    <h2 className="font-display text-[17.5px] leading-6 font-extrabold tracking-tight">
                        {question.title}
                    </h2>
                </div>
                <Badge
                    variant={verdictBadgeVariant(verdict)}
                    className="shrink-0 px-3.5 py-1.5 text-[13.5px]"
                >
                    {verdictLabel(verdict, winningOption, t)}
                </Badge>
            </div>

            <p className="text-secondary-foreground mt-2.5 mb-4 text-[13.5px] leading-[19px]">
                {reason}
            </p>

            <div className={isQuorumFailed ? "opacity-45" : undefined}>
                {isYesNo ? (
                    <YesNoBars
                        question={question}
                        results={results}
                        optionLabels={optionLabels}
                        ruleset={ruleset}
                        isUnitCount={isUnitCount}
                        animated={animated}
                        t={t}
                    />
                ) : (
                    <SingleChoiceBars
                        question={question}
                        results={results}
                        optionLabels={optionLabels}
                        winningOptionId={winningOption?.id ?? null}
                        isQuorumFailed={isQuorumFailed}
                        isUnitCount={isUnitCount}
                        animated={animated}
                        t={t}
                    />
                )}
            </div>
        </Card>
    );
}
