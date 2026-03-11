import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button, FormCheckbox, FormInput, FormSelect } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    SetVoteRulesetDtoMajorityRuleType as MajorityRuleType,
    SetVoteRulesetDtoQuorumElectorateBasis as QuorumElectorateBasis,
    SetVoteRulesetDtoQuorumMeasure as QuorumMeasure,
    SetVoteRulesetDtoWeightBasis as VoteWeightBasis,
} from "@/api/generated/model";
import { useVotesControllerSetVoteRuleset } from "@/api/generated/votes/votes";

const createVoteRulesetSchema = z.object({
    weightBasis: z.nativeEnum(VoteWeightBasis),
    quorumMeasure: z.nativeEnum(QuorumMeasure),
    quorumElectorateBasis: z.nativeEnum(QuorumElectorateBasis),
    quorumThreshold: z.coerce
        .number()
        .min(0, "voting:create.fields.quorumThreshold.errors.positiveNumber"),
    majorityRuleType: z.nativeEnum(MajorityRuleType),
    majorityThreshold: z.coerce
        .string()
        .optional()
        .transform((v) => (v === "" || v === undefined ? undefined : Number(v)))
        .refine((v) => v === undefined || (!isNaN(v) && v >= 0), {
            message:
                "voting:create.fields.majorityThreshold.errors.positiveNumber",
        }),
    allowAbstain: z.boolean(),
    abstainExcludedFromMajorityDenominator: z.boolean(),
});

type CreateVoteRulesetValues = z.infer<typeof createVoteRulesetSchema>;

export interface CreateVoteRulesetStepProps {
    voteId: string | null;
    onSuccess: () => void;
}

export function CreateVoteRulesetStep({
    voteId,
    onSuccess,
}: CreateVoteRulesetStepProps) {
    const { t } = useTranslation(["voting", "errors"]);

    const rulesetForm = useForm<CreateVoteRulesetValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createVoteRulesetSchema) as any,
        defaultValues: {
            weightBasis: VoteWeightBasis.UNIT_SHARE,
            quorumMeasure: QuorumMeasure.UNIT_SHARE,
            quorumElectorateBasis: QuorumElectorateBasis.ALL_UNITS,
            quorumThreshold: 0,
            majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
            allowAbstain: false,
            abstainExcludedFromMajorityDenominator: false,
        },
    });

    const setRulesetMutation = useVotesControllerSetVoteRuleset();

    const onSubmit = (values: CreateVoteRulesetValues) => {
        if (!voteId) return;

        setRulesetMutation.mutate(
            {
                id: voteId,
                data: {
                    ...values,
                    majorityThreshold: values.majorityThreshold ?? undefined,
                },
            },
            {
                onSuccess: () => {
                    toast.success(t("voting:create.toast.rulesetSuccess"));
                    onSuccess();
                },
                onError: showApiError,
            },
        );
    };

    return (
        <FormProvider {...rulesetForm}>
            <form
                onSubmit={rulesetForm.handleSubmit(onSubmit)}
                className="space-y-6"
            >
                <div className="space-y-6">
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
                            step="0.0001"
                            label={t(
                                "voting:create.fields.quorumThreshold.label",
                            )}
                            placeholder={t(
                                "voting:create.fields.quorumThreshold.placeholder",
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormSelect
                            name="majorityRuleType"
                            label={t(
                                "voting:create.fields.majorityRuleType.label",
                            )}
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
                            step="0.0001"
                            label={t(
                                "voting:create.fields.majorityThreshold.label",
                            )}
                            placeholder={t(
                                "voting:create.fields.majorityThreshold.placeholder",
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormCheckbox
                            name="allowAbstain"
                            label={t("voting:create.fields.allowAbstain.label")}
                            description={t(
                                "voting:create.fields.allowAbstain.description",
                            )}
                        />

                        <FormCheckbox
                            name="abstainExcludedFromMajorityDenominator"
                            label={t(
                                "voting:create.fields.abstainExcluded.label",
                            )}
                            description={t(
                                "voting:create.fields.abstainExcluded.description",
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <Button
                        type="submit"
                        disabled={setRulesetMutation.isPending}
                    >
                        {setRulesetMutation.isPending
                            ? "..."
                            : t("voting:create.actions.saveNext")}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
