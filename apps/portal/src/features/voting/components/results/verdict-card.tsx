import type { TFunction } from "i18next";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    VoteOptionResponseDtoOptionKey,
    VoteQuestionResponseDtoType,
    type SetVoteRulesetResponseDto,
    type VoteOptionResponseDto,
    type VoteOptionResultDto,
    type VoteResultsResponseDto,
} from "@/api/generated/model";
import {
    Card,
    formatFraction,
    reduceFraction,
    StatusChip,
    type StatusChipVariant,
    trimTrailingZeros,
} from "@hoa-mngr/ui";

import {
    mapQuestionVerdict,
    type QuestionVerdict,
} from "../../utils/question-verdict";
import { buildMajorityFragment } from "../../utils/rule-sentence";
import {
    computeParticipationStats,
    deriveQuorumThresholdPercentLabel,
} from "./participation-banner";

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

function verdictBadgeVariant(verdict: QuestionVerdict): StatusChipVariant {
    switch (verdict) {
        case "approved":
            return "success";
        case "rejected":
            return "destructive";
        case "winner":
            return "primary";
        case "notDecided":
        default:
            return "warning";
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

// The majority tick's threshold fraction (0-1). The server always
// materializes majorityThreshold now (SIMPLE_MAJORITY -> 1/2, UNANIMITY ->
// 1/1, QUALIFIED_MAJORITY -> its own bar), so this is a plain fraction read
// — no more null-threshold ambiguity to fall back to the ruleset for.
function deriveMajorityFraction(question: EnrichedQuestion): number {
    return question.majorityThreshold.num / question.majorityThreshold.den;
}

// `majorityDenominator.decimal` is basis-dependent, same distinction
// total-voting-power.ts's formatTotalVotingPower already had to solve:
// a UNIT_SHARE weight is a building-share fraction (0-1), so its decimal
// only means something to a reader as a percent of the building's shares;
// a ONE_UNIT_ONE_VOTE weight is a flat per-unit count, so the decimal *is*
// already a literal vote count. `weightBasis` lives on the vote-level
// ruleset and cannot diverge per question (validateQuestionOverride
// requires override.weightBasis === base.weightBasis), so this always
// reads the vote's own ruleset — never the question's effectiveRuleset —
// mirroring how `isUnitCount` is derived below.
function formatMajorityDenominator(
    denominator: { decimal: string },
    weightBasis: string | undefined,
    t: TFunction<"voting">,
): string {
    if (weightBasis === "ONE_UNIT_ONE_VOTE") {
        return t("detail.statusSidebar.totalPowerVotes", {
            count: Math.round(Number(denominator.decimal)),
        });
    }
    const percent = Number(denominator.decimal) * 100;
    return t("resultsV2.thresholdDenominatorShare", {
        percent: trimTrailingZeros(percent.toFixed(2)),
    });
}

// The plain-language threshold caption shown under every question's
// reason sentence: comparator word + exact fraction (e.g. "alespoň 2/3"),
// not a percentage — the wizard's rule sentences already say the percent
// equivalent, this states the legal fraction itself. `majorityThreshold`
// is a RulesetFractionDto (plain numbers), so formatFraction/reduceFraction
// need no BigInt handling. The denominator's exact string fraction is
// surfaced via `title` since it can be a large share-weighted value that
// doesn't round cleanly.
function buildThresholdCaption(
    question: EnrichedQuestion,
    ruleset: SetVoteRulesetResponseDto | null | undefined,
    t: TFunction<"voting">,
): { text: string; title: string } {
    const comparator = t(
        `create.thresholdPicker.comparator.${question.majorityComparator}`,
    );
    const fraction = formatFraction(reduceFraction(question.majorityThreshold));
    return {
        text: t("resultsV2.thresholdCaption", {
            comparator,
            fraction,
            denominator: formatMajorityDenominator(
                question.majorityDenominator,
                ruleset?.weightBasis,
                t,
            ),
        }),
        title: t("resultsV2.thresholdExactTitle", {
            num: question.majorityDenominator.num,
            den: question.majorityDenominator.den,
        }),
    };
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

    if (verdict === "approved" || verdict === "rejected") {
        const forResult = findOptionResultByKey(
            question,
            optionLabels,
            VoteOptionResponseDtoOptionKey.YES,
        );
        // `.percent` is voteWeight / majorityDenominator × 100, precomputed
        // server-side (Rational, not float) — see VoteOptionResultDto.
        const pct = Number(forResult?.percent ?? "0");
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
        const pct = Number(winnerResult?.percent ?? "0");
        return t("resultsV2.reasonWinner", {
            option: winningOption?.label ?? "",
            pct: pct.toFixed(1),
        });
    }

    // notDecided. quorumMet is `null` for per-rollam votes (no quorum by
    // law) — only an explicit `false` means quorum actually failed; a null
    // "notDecided" here can only mean the majority wasn't met.
    if (results.quorumMet === false) {
        const { pct } = computeParticipationStats(results, ruleset);
        return t("resultsV2.reasonNoQuorum", {
            turnout: pct.toFixed(1),
            threshold: deriveQuorumThresholdPercentLabel(ruleset),
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
    isUnitCount: boolean;
    animated: boolean;
    t: TFunction<"voting">;
}

function YesNoBars({
    question,
    results,
    optionLabels,
    isUnitCount,
    animated,
    t,
}: YesNoBarsProps) {
    // A UNIT_COUNT vote counts units everywhere else on this page (headline
    // %, participation sentence), so the bars use the same axis: units over
    // the vote's unit denominator. The weight axis uses totalVotesWeight's
    // rounded `.decimal` (4 places) — plenty of precision for a bar width.
    const denom = isUnitCount
        ? results.totalVotesUnitCount
        : Number(results.totalVotesWeight.decimal);
    const pctOf = (option: VoteOptionResultDto | undefined) => {
        if (denom <= 0) return 0;
        const value = isUnitCount
            ? option?.voteUnitCount ?? 0
            : Number(option?.voteWeight.decimal ?? "0");
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
    const majorityFraction = deriveMajorityFraction(question);
    const majorityDenominatorDecimal = Number(
        question.majorityDenominator.decimal,
    );
    const majorityTickPct =
        denom > 0
            ? Math.min(
                  100,
                  ((majorityDenominatorDecimal * majorityFraction) / denom) *
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
                        className="bg-faint h-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
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
            <div className="text-secondary-foreground text-detail mt-2.5 flex flex-wrap items-center gap-4">
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
                        colorClass="bg-faint"
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
    // denominator for a UNIT_COUNT vote. The weight axis instead reuses each
    // option's server-precomputed `.percent` (voteWeight / majorityDenominator
    // × 100, exact Rational math) rather than re-deriving it from the raw
    // fractions.
    return (
        <div className="flex flex-col gap-2.5">
            {question.optionResults.map((opt) => {
                const meta = optionLabels[opt.optionId] ?? {
                    label: opt.optionId,
                    optionKey: "",
                };
                const isWinner = opt.optionId === winningOptionId;
                const pct = isUnitCount
                    ? results.totalVotesUnitCount > 0
                        ? (opt.voteUnitCount / results.totalVotesUnitCount) *
                          100
                        : 0
                    : Number(opt.percent);

                return (
                    <div key={opt.optionId}>
                        <div className="text-detail mb-1 flex items-center justify-between">
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
                                    <span className="bg-primary-tint text-primary-tint-foreground text-2xs ml-1.5 rounded-[6px] px-1.5 py-0.5 font-semibold">
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

    // Quorum measure is vote-level (spec section 3), so this deliberately reads the
    // vote's ruleset and never the question's effectiveRuleset — a majority
    // override must not flip the axis the bars are drawn on. `quorum` is
    // null for PER_ROLLAM votes (no quorum by law), which defaults to the
    // weight axis.
    const isUnitCount = ruleset?.quorum?.measure === "UNIT_COUNT";

    // quorumMet is `null` for per-rollam votes — only an explicit `false`
    // means quorum actually failed.
    const isQuorumFailed = results.quorumMet === false;
    const reason = buildReason({
        verdict,
        question,
        results,
        optionLabels,
        ruleset,
        winningOption,
        t,
    });
    const thresholdCaption = buildThresholdCaption(question, ruleset, t);

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
                    <p className="text-primary text-2xs mb-1 font-bold tracking-wider uppercase">
                        {t("resultsV2.resolutionLabel", { index })}
                        {!isYesNo && ` · ${t("resultsV2.multipleChoice")}`}
                    </p>
                    <h2 className="font-display text-title leading-6 font-extrabold tracking-tight">
                        {question.title}
                    </h2>
                </div>
                <StatusChip
                    variant={verdictBadgeVariant(verdict)}
                    className="text-detail shrink-0 px-3.5 py-1.5"
                >
                    {verdictLabel(verdict, winningOption, t)}
                </StatusChip>
            </div>

            <p className="text-secondary-foreground text-detail mt-2.5 mb-1 leading-[19px]">
                {reason}
            </p>
            <p
                className="text-muted-foreground mb-4 cursor-help text-xs"
                title={thresholdCaption.title}
            >
                {thresholdCaption.text}
            </p>

            <div className={isQuorumFailed ? "opacity-45" : undefined}>
                {isYesNo ? (
                    <YesNoBars
                        question={question}
                        results={results}
                        optionLabels={optionLabels}
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
