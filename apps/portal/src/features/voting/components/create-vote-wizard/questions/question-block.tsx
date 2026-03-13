import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ChevronDown,
    ChevronUp,
    GripVertical,
    Settings2,
    Trash2,
} from "lucide-react";
import { useState, useEffect, CSSProperties } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button, cn, FormInput, FormSelect } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    CreateVoteQuestionDtoType,
    VoteDetailResponseDto,
    VoteQuestionResponseDto,
} from "@/api/generated/model";
import {
    useVotesControllerDeleteVoteQuestion,
    useVotesControllerUpdateVoteQuestion,
} from "@/api/generated/votes/votes";

import { OptionsList } from "./options-list";
import { RulesetFormFields } from "../shared/ruleset-form-fields";
import {
    createVoteRulesetSchema,
    rulesetDefaultValues,
} from "../steps/ruleset-step";

const questionSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.nativeEnum(CreateVoteQuestionDtoType),
    useCustomRuleset: z.boolean(),
    // Ruleset override fields (flat — managed by RulesetFormFields when useCustomRuleset=true)
    weightBasis: createVoteRulesetSchema.shape.weightBasis,
    quorumMeasure: createVoteRulesetSchema.shape.quorumMeasure,
    quorumElectorateBasis: createVoteRulesetSchema.shape.quorumElectorateBasis,
    quorumThreshold: createVoteRulesetSchema.shape.quorumThreshold,
    majorityRuleType: createVoteRulesetSchema.shape.majorityRuleType,
    majorityThreshold: createVoteRulesetSchema.shape.majorityThreshold,
    allowAbstain: createVoteRulesetSchema.shape.allowAbstain,
    abstainExcludedFromMajorityDenominator:
        createVoteRulesetSchema.shape.abstainExcludedFromMajorityDenominator,
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuestionBlockProps {
    vote: VoteDetailResponseDto;
    question: VoteQuestionResponseDto;
    onRefresh: () => void;
}

export function QuestionBlock({
    vote,
    question,
    onRefresh,
}: QuestionBlockProps) {
    const { t } = useTranslation(["voting"]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isOverrideVisible, setIsOverrideVisible] = useState(false);

    const hasOverride = !!question.rulesetOverride;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    const form = useForm<QuestionFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(questionSchema) as any,
        defaultValues: {
            title: question.title,
            description: question.description ?? "",
            type: question.type as CreateVoteQuestionDtoType,
            useCustomRuleset: hasOverride,
            ...(hasOverride
                ? {
                      weightBasis: question.rulesetOverride!.weightBasis,
                      quorumMeasure: question.rulesetOverride!.quorumMeasure,
                      quorumElectorateBasis:
                          question.rulesetOverride!.quorumElectorateBasis,
                      quorumThreshold:
                          question.rulesetOverride!.quorumThreshold,
                      majorityRuleType:
                          question.rulesetOverride!.majorityRuleType,
                      majorityThreshold:
                          question.rulesetOverride!.majorityThreshold ??
                          undefined,
                      allowAbstain: question.rulesetOverride!.allowAbstain,
                      abstainExcludedFromMajorityDenominator:
                          question.rulesetOverride!
                              .abstainExcludedFromMajorityDenominator,
                  }
                : rulesetDefaultValues),
        },
    });

    useEffect(() => {
        const subscription = form.watch(() => {});
        return () => subscription.unsubscribe();
    }, [form]);

    useEffect(() => {
        if (!form.formState.isDirty) {
            form.reset({
                title: question.title,
                description: question.description ?? undefined,
                type: question.type as CreateVoteQuestionDtoType,
                useCustomRuleset: hasOverride,
                ...(hasOverride
                    ? {
                          weightBasis: question.rulesetOverride!.weightBasis,
                          quorumMeasure:
                              question.rulesetOverride!.quorumMeasure,
                          quorumElectorateBasis:
                              question.rulesetOverride!.quorumElectorateBasis,
                          quorumThreshold:
                              question.rulesetOverride!.quorumThreshold,
                          majorityRuleType:
                              question.rulesetOverride!.majorityRuleType,
                          majorityThreshold:
                              question.rulesetOverride!.majorityThreshold ??
                              undefined,
                          allowAbstain: question.rulesetOverride!.allowAbstain,
                          abstainExcludedFromMajorityDenominator:
                              question.rulesetOverride!
                                  .abstainExcludedFromMajorityDenominator,
                      }
                    : rulesetDefaultValues),
            });
        }
    }, [question, form, hasOverride]);

    const updateMutation = useVotesControllerUpdateVoteQuestion();
    const deleteMutation = useVotesControllerDeleteVoteQuestion();

    const buildRulesetOverride = (values: QuestionFormValues) => {
        if (!values.useCustomRuleset) return undefined;
        return {
            weightBasis: values.weightBasis,
            quorumMeasure: values.quorumMeasure,
            quorumElectorateBasis: values.quorumElectorateBasis,
            quorumThreshold: Number(values.quorumThreshold),
            majorityRuleType: values.majorityRuleType,
            majorityThreshold:
                values.majorityThreshold !== undefined &&
                values.majorityThreshold !== null &&
                String(values.majorityThreshold) !== ""
                    ? Number(values.majorityThreshold)
                    : undefined,
            allowAbstain: values.allowAbstain,
            abstainExcludedFromMajorityDenominator:
                values.abstainExcludedFromMajorityDenominator,
        };
    };

    const handleSave = (forcedValues?: QuestionFormValues) => {
        const values = forcedValues || form.getValues();

        const hasChanged =
            values.title !== question.title ||
            values.description !==
                (typeof question.description === "string"
                    ? question.description
                    : "") ||
            values.type !== question.type ||
            values.useCustomRuleset !== hasOverride;

        if (!forcedValues && !hasChanged) return;

        updateMutation.mutate(
            {
                id: vote.id,
                questionId: question.id,
                data: {
                    title: values.title,
                    type: values.type,
                    description: values.description ?? undefined,
                    sortOrder: question.sortOrder,
                    rulesetOverride: buildRulesetOverride(values),
                    ...(values.type === CreateVoteQuestionDtoType.YES_NO
                        ? {}
                        : {
                              options: question.options
                                  .filter((o) => o.optionKey === "CUSTOM")
                                  .map((o) => ({
                                      label: o.label,
                                      sortOrder: o.sortOrder,
                                  })),
                          }),
                },
            },
            {
                onSuccess: () => {
                    form.reset(values);
                    onRefresh();
                },
                onError: showApiError,
            },
        );
    };

    const handleBlurSave = () => handleSave();

    const handleDelete = () => {
        deleteMutation.mutate(
            {
                id: vote.id,
                questionId: question.id,
            },
            {
                onSuccess: () => {
                    onRefresh();
                },
                onError: showApiError,
            },
        );
    };

    const handleToggleCustomRuleset = () => {
        setIsOverrideVisible(!isOverrideVisible);
    };

    const handleRemoveOverride = () => {
        form.setValue("useCustomRuleset", false, { shouldDirty: true });
        setIsOverrideVisible(false);
        handleSave({
            ...form.getValues(),
            useCustomRuleset: false,
        });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-card rounded-lg border shadow-sm transition-shadow",
                isDragging &&
                    "border-primary scale-[1.02] opacity-50 shadow-lg",
            )}
        >
            <div className="flex items-center gap-2 border-b p-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="text-muted-foreground hover:text-foreground cursor-grab p-1 active:cursor-grabbing"
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                <div className="flex-1 truncate font-medium">
                    {form.watch("title") ||
                        t("voting:create.steps.questions.defaultTitle")}
                </div>

                <div className="flex items-center gap-1">
                    {hasOverride && (
                        <div className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                            <Settings2 className="h-3 w-3" />
                            {t("voting:create.steps.questions.override.badge")}
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        type="button"
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        type="button"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-4 p-4">
                    <FormProvider {...form}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormInput
                                name="title"
                                label={t(
                                    "voting:create.steps.questions.fields.title.label",
                                )}
                                placeholder={t(
                                    "voting:create.steps.questions.fields.title.placeholder",
                                )}
                                onBlur={handleBlurSave}
                            />

                            <FormSelect
                                name="type"
                                label={t(
                                    "voting:create.steps.questions.fields.type.label",
                                )}
                                options={[
                                    {
                                        label: t(
                                            "voting:create.steps.questions.fields.type.options.YES_NO",
                                        ),
                                        value: CreateVoteQuestionDtoType.YES_NO,
                                    },
                                    {
                                        label: t(
                                            "voting:create.steps.questions.fields.type.options.SINGLE_CHOICE",
                                        ),
                                        value: CreateVoteQuestionDtoType.SINGLE_CHOICE,
                                    },
                                ]}
                                onValueChange={(val: string) =>
                                    handleSave({
                                        ...form.getValues(),
                                        type: val as CreateVoteQuestionDtoType,
                                    })
                                }
                            />
                        </div>

                        <FormInput
                            name="description"
                            label={t(
                                "voting:create.steps.questions.fields.description.label",
                            )}
                            placeholder={t(
                                "voting:create.steps.questions.fields.description.placeholder",
                            )}
                            onBlur={handleBlurSave}
                        />

                        <OptionsList
                            voteId={vote.id}
                            question={question}
                            onRefresh={onRefresh}
                        />

                        <div className="border-t pt-4">
                            <button
                                type="button"
                                onClick={handleToggleCustomRuleset}
                                className={cn(
                                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    hasOverride
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                                )}
                            >
                                <Settings2 className="h-4 w-4" />
                                {isOverrideVisible
                                    ? t(
                                          "voting:create.steps.questions.override.toggleActive",
                                      )
                                    : t(
                                          "voting:create.steps.questions.override.toggleInactive",
                                      )}
                            </button>

                            {!hasOverride && (
                                <p className="text-muted-foreground mt-1 px-3 text-xs">
                                    {t(
                                        "voting:create.steps.questions.override.defaultHint",
                                    )}
                                </p>
                            )}

                            {isOverrideVisible && (
                                <div className="mt-4 rounded-md border bg-slate-50/50 p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="text-muted-foreground text-sm">
                                            {t(
                                                "voting:create.steps.questions.override.description",
                                            )}
                                        </p>
                                        {hasOverride && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs"
                                                onClick={handleRemoveOverride}
                                            >
                                                <Trash2 className="mr-1 h-3 w-3" />
                                                {t(
                                                    "voting:create.steps.questions.override.remove",
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                    <RulesetFormFields />
                                    <div className="mt-4 flex justify-end">
                                        {!hasOverride && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => {
                                                    form.setValue(
                                                        "useCustomRuleset",
                                                        true,
                                                    );
                                                    handleSave(
                                                        form.getValues(),
                                                    );
                                                }}
                                                disabled={
                                                    updateMutation.isPending
                                                }
                                            >
                                                {t(
                                                    "voting:create.steps.questions.override.apply",
                                                )}
                                            </Button>
                                        )}
                                        {hasOverride && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() =>
                                                    handleSave(form.getValues())
                                                }
                                                disabled={
                                                    updateMutation.isPending
                                                }
                                            >
                                                {t(
                                                    "voting:create.steps.questions.override.update",
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormProvider>
                </div>
            )}
        </div>
    );
}
