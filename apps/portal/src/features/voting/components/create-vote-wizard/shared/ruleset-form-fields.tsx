import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn, FormCheckbox, FormInput, FormSelect } from "@hoa-mngr/ui";

import {
    SetVoteRulesetDtoMajorityRuleType as MajorityRuleType,
    SetVoteRulesetDtoQuorumElectorateBasis as QuorumElectorateBasis,
    SetVoteRulesetDtoQuorumMeasure as QuorumMeasure,
    SetVoteRulesetDtoWeightBasis as VoteWeightBasis,
} from "@/api/generated/model";

import { LegalValidityDisclaimer } from "./legal-validity-disclaimer";

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
 * Shared form fields for configuring a vote ruleset.
 * Used both in the vote-level ruleset step (as the default for all questions)
 * and inside individual question blocks (as per-question overrides).
 *
 * Expects to be rendered inside a FormProvider / react-hook-form context.
 * Field names match the SetVoteRulesetDto schema.
 */
interface RulesetFormFieldsProps {
    showCoOwnerOption?: boolean;
    /**
     * "full" renders every ruleset field (used for the vote-level step).
     * "majorityOnly" renders only majorityRuleType, majorityThreshold,
     * allowAbstain and abstainExcludedFromMajorityDenominator — weight
     * basis and quorum are vote-level per Czech law and have no per-question
     * effect, so they're hidden (but still submitted with their existing
     * values by the caller — see mapQuestionToUpdateDto).
     */
    variant?: "full" | "majorityOnly";
}

export function RulesetFormFields({
    showCoOwnerOption = true,
    variant = "full",
}: RulesetFormFieldsProps) {
    const { t } = useTranslation(["voting"]);
    const { watch } = useFormContext();

    // Reused as both the visible section heading and the radiogroup's
    // aria-label for the corresponding SelectionCards below.
    const weightBasisLabel = t("voting:create.fields.weightBasis.label");
    const majorityRuleTypeLabel = t(
        "voting:create.fields.majorityRuleType.label",
    );

    const majorityRuleType = watch("majorityRuleType");
    const isMajorityThresholdDisabled =
        majorityRuleType === MajorityRuleType.SIMPLE_MAJORITY;

    const weightBasis = watch("weightBasis");
    const quorumElectorateBasis = watch("quorumElectorateBasis");
    const abstainExcluded = watch("abstainExcludedFromMajorityDenominator");
    const allowCoOwnerIndividualVote = watch("allowCoOwnerIndividualVote");

    // Weight basis and quorum electorate basis (and the co-owner option)
    // aren't rendered in "majorityOnly", so they can't be what triggered a
    // non-standard value here — only surface the disclaimer for the field
    // that's actually visible in that variant (abstain exclusion).
    const hasNonStandardRules =
        abstainExcluded === true ||
        (variant === "full" &&
            (weightBasis !== VoteWeightBasis.UNIT_SHARE ||
                quorumElectorateBasis !== QuorumElectorateBasis.ALL_UNITS ||
                allowCoOwnerIndividualVote === true));

    return (
        <div className="space-y-6">
            {hasNonStandardRules && <LegalValidityDisclaimer />}

            {variant === "full" && (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold">
                                {weightBasisLabel}
                            </p>
                            <SelectionCards
                                name="weightBasis"
                                groupLabel={weightBasisLabel}
                                options={[
                                    {
                                        value: VoteWeightBasis.UNIT_SHARE,
                                        label: t(
                                            "voting:create.fields.weightBasis.options.UNIT_SHARE",
                                        ),
                                        hint: t(
                                            "voting:create.fields.weightBasis.cards.UNIT_SHARE.hint",
                                        ),
                                    },
                                    {
                                        value: VoteWeightBasis.ONE_UNIT_ONE_VOTE,
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

                        <FormSelect
                            name="quorumElectorateBasis"
                            label={t(
                                "voting:create.fields.quorumElectorateBasis.label",
                            )}
                            placeholder={t(
                                "voting:create.fields.quorumElectorateBasis.placeholder",
                            )}
                            options={[
                                {
                                    label: t(
                                        "voting:create.fields.quorumElectorateBasis.options.ALL_UNITS",
                                    ),
                                    value: QuorumElectorateBasis.ALL_UNITS,
                                },
                                {
                                    label: t(
                                        "voting:create.fields.quorumElectorateBasis.options.ELIGIBLE_UNITS_ONLY",
                                    ),
                                    value: QuorumElectorateBasis.ELIGIBLE_UNITS_ONLY,
                                },
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormSelect
                            name="quorumMeasure"
                            label={t(
                                "voting:create.fields.quorumMeasure.label",
                            )}
                            placeholder={t(
                                "voting:create.fields.quorumMeasure.placeholder",
                            )}
                            options={[
                                {
                                    label: t(
                                        "voting:create.fields.quorumMeasure.options.UNIT_SHARE",
                                    ),
                                    value: QuorumMeasure.UNIT_SHARE,
                                },
                                {
                                    label: t(
                                        "voting:create.fields.quorumMeasure.options.UNIT_COUNT",
                                    ),
                                    value: QuorumMeasure.UNIT_COUNT,
                                },
                            ]}
                        />

                        <FormInput
                            name="quorumThreshold"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            suffix="%"
                            label={t(
                                "voting:create.fields.quorumThreshold.label",
                            )}
                        />
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <p className="text-sm font-semibold">
                        {majorityRuleTypeLabel}
                    </p>
                    <SelectionCards
                        name="majorityRuleType"
                        groupLabel={majorityRuleTypeLabel}
                        options={[
                            {
                                value: MajorityRuleType.SIMPLE_MAJORITY,
                                label: t(
                                    "voting:create.fields.majorityRuleType.options.SIMPLE_MAJORITY",
                                ),
                                hint: t(
                                    "voting:create.fields.majorityRuleType.cards.SIMPLE_MAJORITY.hint",
                                ),
                            },
                            {
                                value: MajorityRuleType.QUALIFIED_MAJORITY,
                                label: t(
                                    "voting:create.fields.majorityRuleType.options.QUALIFIED_MAJORITY",
                                ),
                                hint: t(
                                    "voting:create.fields.majorityRuleType.cards.QUALIFIED_MAJORITY.hint",
                                ),
                            },
                        ]}
                    />
                </div>

                <FormInput
                    name="majorityThreshold"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    suffix="%"
                    label={t("voting:create.fields.majorityThreshold.label")}
                    disabled={isMajorityThresholdDisabled}
                />
            </div>

            <div
                className={`grid grid-cols-1 gap-4 ${showCoOwnerOption ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
            >
                <FormCheckbox
                    name="allowAbstain"
                    label={t("voting:create.fields.allowAbstain.label")}
                    description={t(
                        "voting:create.fields.allowAbstain.description",
                    )}
                />

                <FormCheckbox
                    name="abstainExcludedFromMajorityDenominator"
                    label={t("voting:create.fields.abstainExcluded.label")}
                    description={t(
                        "voting:create.fields.abstainExcluded.description",
                    )}
                />

                {showCoOwnerOption && (
                    <FormCheckbox
                        name="allowCoOwnerIndividualVote"
                        label={t(
                            "voting:create.fields.allowCoOwnerIndividualVote.label",
                        )}
                        description={t(
                            "voting:create.fields.allowCoOwnerIndividualVote.description",
                        )}
                    />
                )}
            </div>
        </div>
    );
}
