import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { FormCheckbox, FormInput, FormSelect } from "@hoa-mngr/ui";

import {
    SetVoteRulesetDtoMajorityRuleType as MajorityRuleType,
    SetVoteRulesetDtoQuorumElectorateBasis as QuorumElectorateBasis,
    SetVoteRulesetDtoQuorumMeasure as QuorumMeasure,
    SetVoteRulesetDtoWeightBasis as VoteWeightBasis,
} from "@/api/generated/model";

import { LegalValidityDisclaimer } from "./legal-validity-disclaimer";

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
}

export function RulesetFormFields({
    showCoOwnerOption = true,
}: RulesetFormFieldsProps) {
    const { t } = useTranslation(["voting"]);
    const { watch } = useFormContext();

    const majorityRuleType = watch("majorityRuleType");
    const isMajorityThresholdDisabled =
        majorityRuleType === MajorityRuleType.SIMPLE_MAJORITY;

    const weightBasis = watch("weightBasis");
    const quorumElectorateBasis = watch("quorumElectorateBasis");
    const abstainExcluded = watch("abstainExcludedFromMajorityDenominator");
    const allowCoOwnerIndividualVote = watch("allowCoOwnerIndividualVote");

    const hasNonStandardRules =
        weightBasis !== VoteWeightBasis.UNIT_SHARE ||
        quorumElectorateBasis !== QuorumElectorateBasis.ALL_UNITS ||
        abstainExcluded === true ||
        allowCoOwnerIndividualVote === true;

    return (
        <div className="space-y-6">
            {hasNonStandardRules && <LegalValidityDisclaimer />}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSelect
                    name="weightBasis"
                    label={t("voting:create.fields.weightBasis.label")}
                    placeholder={t(
                        "voting:create.fields.weightBasis.placeholder",
                    )}
                    options={[
                        {
                            label: t(
                                "voting:create.fields.weightBasis.options.UNIT_SHARE",
                            ),
                            value: VoteWeightBasis.UNIT_SHARE,
                        },
                        {
                            label: t(
                                "voting:create.fields.weightBasis.options.ONE_UNIT_ONE_VOTE",
                            ),
                            value: VoteWeightBasis.ONE_UNIT_ONE_VOTE,
                        },
                    ]}
                />

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
                    label={t("voting:create.fields.quorumMeasure.label")}
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
                    label={t("voting:create.fields.quorumThreshold.label")}
                />
            </div>

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
                            value: MajorityRuleType.SIMPLE_MAJORITY,
                        },
                        {
                            label: t(
                                "voting:create.fields.majorityRuleType.options.QUALIFIED_MAJORITY",
                            ),
                            value: MajorityRuleType.QUALIFIED_MAJORITY,
                        },
                    ]}
                />

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
