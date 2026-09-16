import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
    Checkbox,
    cn,
    FormCheckbox,
    FormSelect,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@hoa-mngr/ui";

import { tierIssues } from "./ruleset-legal";
import type { CreateVoteRulesetValues } from "./ruleset-schema";
import { ThresholdPicker } from "./threshold-picker";

type VoteMode = "PER_ROLLAM" | "ASSEMBLY_RECORD";
type MajorityDenominatorBasis = "VOTES_CAST" | "ALL_VOTES";

interface SelectionCardOption {
    value: string;
    label: string;
    hint: string;
}

interface SelectionCardsProps {
    name: string;
    options: SelectionCardOption[];
    /**
     * Accessible name for the radiogroup. Callers reuse the same text as the
     * visible section heading rendered above the cards.
     */
    groupLabel: string;
}

/**
 * A 2-option card picker used in place of a `FormSelect` for the handful of
 * ruleset fields that benefit from a plain-language label + hint instead of
 * a dropdown. Reads/writes the field directly via `useFormContext` rather
 * than going through `<FormField>` since there's no validation message to
 * surface here (both fields are enums with a default value).
 *
 * The two options are mutually exclusive, so this exposes proper
 * `radiogroup`/`radio` semantics rather than relying on visual (color/
 * border) state alone — a screen reader needs `aria-checked` to know which
 * option is active and that the pair forms a single-choice group. The
 * buttons stay native `<button>`s (not a roving-tabindex custom radio) so
 * Enter/Space activation keeps working for free; this repo has no existing
 * roving-focus pattern to reuse, so a full arrow-key implementation was
 * judged out of scope for this fix.
 */
function SelectionCards({ name, options, groupLabel }: SelectionCardsProps) {
    const { watch, setValue } = useFormContext();
    const currentValue = watch(name);

    return (
        <div
            role="radiogroup"
            aria-label={groupLabel}
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        >
            {options.map((option) => {
                const isSelected = currentValue === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() =>
                            setValue(name, option.value, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        className={cn(
                            "rounded-panel focus-visible:ring-ring cursor-pointer border p-3 text-left text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                            isSelected
                                ? "border-primary bg-primary-tint border-2"
                                : "border-border bg-card",
                        )}
                    >
                        <p>{option.label}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                            {option.hint}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Statutory derivation for `majorityDenominatorBasis`. Returns `null` when the
 * field is a real choice and the board may set it.
 *
 * For an assembly it always is one: a majority of those present is the default
 * the law sets, but the bylaws may demand a higher number, and a majority of
 * *all* votes over the same threshold is strictly harder to reach. Unanimity
 * is the one assembly case still forced — unanimity of those present would let
 * a nearly empty meeting pass anything — and per rollam is fixed by statute.
 * `ruleset-legal.ts`'s tier1 rules have always agreed; only this form locked
 * the field.
 */
function derivedMajorityBasis(
    mode: VoteMode,
    majorityRuleType: string,
): MajorityDenominatorBasis | null {
    if (majorityRuleType === "UNANIMITY") return "ALL_VOTES";
    if (mode === "PER_ROLLAM") return "ALL_VOTES";
    return null;
}

/**
 * Shared form fields for configuring a vote ruleset.
 * Used both in the vote-level ruleset step (as the default for all questions)
 * and inside individual question blocks (as per-question overrides).
 *
 * Expects to be rendered inside a FormProvider / react-hook-form context.
 * Field names match the SetVoteRulesetDto schema (or, for "majorityOnly",
 * the subset of it that per-question overrides may touch).
 */
interface RulesetFormFieldsProps {
    /** The vote's mode — drives quorum visibility and the basis derivation. */
    mode: VoteMode;
    /**
     * "full" renders every ruleset field plus the tier1/tier3 legal-validity
     * panel (used for the vote-level step). "majorityOnly" renders only
     * majorityRuleType, majorityDenominatorBasis and the threshold/comparator
     * picker — weight basis, quorum and allowAbstain are vote-level and must
     * equal the base ruleset for an override to be accepted server-side (see
     * validateQuestionOverride), so they're not editable here at all.
     */
    variant?: "full" | "majorityOnly";
}

export function RulesetFormFields({
    mode,
    variant = "full",
}: RulesetFormFieldsProps) {
    const { t } = useTranslation(["voting"]);
    const form = useFormContext();

    const majorityRuleType = form.watch("majorityRuleType");
    const majorityDenominatorBasis = form.watch("majorityDenominatorBasis");
    const quorum = form.watch("quorum");

    const derivedBasis = derivedMajorityBasis(mode, majorityRuleType);

    useEffect(() => {
        if (derivedBasis && majorityDenominatorBasis !== derivedBasis) {
            form.setValue("majorityDenominatorBasis", derivedBasis, {
                shouldDirty: true,
                shouldValidate: true,
            });
        }
        // form.setValue is stable across renders; only re-run when the
        // derivation's own inputs change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [derivedBasis, majorityDenominatorBasis]);

    const basisLabel = (basis: MajorityDenominatorBasis) =>
        t(`voting:create.fields.majorityDenominatorBasis.options.${basis}`);

    const weightBasisLabel = t("voting:create.fields.weightBasis.label");

    const issues =
        variant === "full"
            ? tierIssues(mode, form.watch() as CreateVoteRulesetValues)
            : { tier1: [], tier3: [] };

    return (
        <div className="space-y-6">
            {variant === "full" && (
                <>
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">
                            {weightBasisLabel}
                        </p>
                        <SelectionCards
                            name="weightBasis"
                            groupLabel={weightBasisLabel}
                            options={[
                                {
                                    value: "UNIT_SHARE",
                                    label: t(
                                        "voting:create.fields.weightBasis.options.UNIT_SHARE",
                                    ),
                                    hint: t(
                                        "voting:create.fields.weightBasis.cards.UNIT_SHARE.hint",
                                    ),
                                },
                                {
                                    value: "ONE_UNIT_ONE_VOTE",
                                    label: t(
                                        "voting:create.fields.weightBasis.options.ONE_UNIT_ONE_VOTE",
                                    ),
                                    hint: t(
                                        "voting:create.fields.weightBasis.cards.ONE_UNIT_ONE_VOTE.hint",
                                    ),
                                },
                            ]}
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold">
                            {t("voting:create.fields.quorum.label")}
                        </p>
                        {mode === "ASSEMBLY_RECORD" ? (
                            <div className="space-y-3">
                                <Select
                                    value={quorum?.measure ?? "UNIT_SHARE"}
                                    onValueChange={(nextMeasure) =>
                                        form.setValue(
                                            "quorum",
                                            {
                                                measure: nextMeasure,
                                                threshold:
                                                    quorum?.threshold ?? {
                                                        num: 1,
                                                        den: 2,
                                                    },
                                                comparator:
                                                    quorum?.comparator ??
                                                    "STRICT_GREATER",
                                            },
                                            {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            },
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UNIT_SHARE">
                                            {t(
                                                "voting:create.fields.quorumMeasure.options.UNIT_SHARE",
                                            )}
                                        </SelectItem>
                                        <SelectItem value="UNIT_COUNT">
                                            {t(
                                                "voting:create.fields.quorumMeasure.options.UNIT_COUNT",
                                            )}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <ThresholdPicker
                                    value={quorum?.threshold}
                                    onChange={(threshold) =>
                                        threshold &&
                                        form.setValue(
                                            "quorum",
                                            {
                                                measure:
                                                    quorum?.measure ??
                                                    "UNIT_SHARE",
                                                threshold,
                                                comparator:
                                                    quorum?.comparator ??
                                                    "STRICT_GREATER",
                                            },
                                            {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            },
                                        )
                                    }
                                    comparator={
                                        quorum?.comparator ?? "STRICT_GREATER"
                                    }
                                    onComparatorChange={(comparator) =>
                                        form.setValue(
                                            "quorum",
                                            {
                                                measure:
                                                    quorum?.measure ??
                                                    "UNIT_SHARE",
                                                threshold:
                                                    quorum?.threshold ?? {
                                                        num: 1,
                                                        den: 2,
                                                    },
                                                comparator,
                                            },
                                            {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            },
                                        )
                                    }
                                />
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                {t("voting:create.fields.quorum.perRollamNone")}
                            </p>
                        )}
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSelect
                    name="majorityRuleType"
                    label={t("voting:create.fields.majorityRuleType.label")}
                    placeholder={t(
                        "voting:create.fields.majorityRuleType.placeholder",
                    )}
                    options={[
                        {
                            label: t(
                                "voting:create.fields.majorityRuleType.options.SIMPLE_MAJORITY",
                            ),
                            value: "SIMPLE_MAJORITY",
                        },
                        {
                            label: t(
                                "voting:create.fields.majorityRuleType.options.QUALIFIED_MAJORITY",
                            ),
                            value: "QUALIFIED_MAJORITY",
                        },
                        {
                            label: t(
                                "voting:create.fields.majorityRuleType.options.UNANIMITY",
                            ),
                            value: "UNANIMITY",
                        },
                    ]}
                />

                {/* Rendered through the same FormSelect as "Typ většiny" so the two
                    cells share one label/trigger structure; when the statute
                    derives the basis the select is simply disabled. */}
                <FormSelect
                    name="majorityDenominatorBasis"
                    label={t(
                        "voting:create.fields.majorityDenominatorBasis.label",
                    )}
                    description={
                        !derivedBasis && mode === "ASSEMBLY_RECORD"
                            ? t(
                                  "voting:create.fields.majorityDenominatorBasis.assemblyHint",
                              )
                            : undefined
                    }
                    disabled={!!derivedBasis}
                    options={[
                        {
                            label: basisLabel("VOTES_CAST"),
                            value: "VOTES_CAST",
                        },
                        {
                            label: basisLabel("ALL_VOTES"),
                            value: "ALL_VOTES",
                        },
                    ]}
                />
            </div>

            {majorityRuleType === "QUALIFIED_MAJORITY" && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold">
                        {t("voting:create.fields.majorityThreshold.label")}
                    </p>
                    <ThresholdPicker
                        value={form.watch("majorityThreshold")}
                        onChange={(threshold) =>
                            form.setValue("majorityThreshold", threshold, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        comparator={
                            form.watch("majorityComparator") ?? "AT_LEAST"
                        }
                        onComparatorChange={(comparator) =>
                            form.setValue("majorityComparator", comparator, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                    />
                </div>
            )}

            {variant === "full" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormCheckbox
                        name="allowAbstain"
                        label={t("voting:create.fields.allowAbstain.label")}
                        description={t(
                            "voting:create.fields.allowAbstain.description",
                        )}
                    />
                </div>
            )}

            {variant === "full" && (
                <div className="space-y-2">
                    {issues.tier1.map((issue) => (
                        <p
                            key={issue.code}
                            className="text-destructive text-sm"
                        >
                            {t(`voting:create.legal.tier1.${issue.code}`, {
                                defaultValue: issue.code,
                            })}
                        </p>
                    ))}
                    {issues.tier3.length > 0 && (
                        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <Checkbox
                                checked={form.watch("acknowledgedNonStatutory")}
                                onCheckedChange={(checked) =>
                                    form.setValue(
                                        "acknowledgedNonStatutory",
                                        checked === true,
                                        {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        },
                                    )
                                }
                            />
                            <span className="text-sm text-amber-900">
                                {t("voting:create.legal.ackLabel", {
                                    deviations: issues.tier3
                                        .map((deviation) =>
                                            t(
                                                `voting:create.legal.tier3.${deviation}`,
                                            ),
                                        )
                                        .join(", "),
                                })}
                            </span>
                        </label>
                    )}
                </div>
            )}
        </div>
    );
}
