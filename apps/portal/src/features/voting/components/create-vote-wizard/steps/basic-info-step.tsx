import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInDays } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { FormDatetimePicker, FormInput, FormTextarea } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { VoteDetailResponseDto } from "@/api/generated/model";
import {
    useVotesControllerCreateVote,
    useVotesControllerUpdateVote,
} from "@/api/generated/votes/votes";

const createVoteFormSchema = z.object({
    title: z.string().min(1, "voting:create.fields.title.errors.required"),
    description: z.string().optional(),
    scheduledFrom: z.string().optional(),
    scheduledTo: z.string().optional(),
});

type CreateVoteFormValues = z.infer<typeof createVoteFormSchema>;

export interface CreateVoteBasicInfoStepProps {
    onSuccess: (id: string) => void;
    voteId?: string | null;
    initialData?: VoteDetailResponseDto;
    /** Id the wizard footer's Continue button submits via `form={formId}`. */
    formId: string;
    onDirtyChange: (dirty: boolean) => void;
    onSavingChange?: (saving: boolean) => void;
}

export function CreateVoteBasicInfoStep({
    onSuccess,
    voteId,
    initialData,
    formId,
    onDirtyChange,
    onSavingChange,
}: CreateVoteBasicInfoStepProps) {
    const { t } = useTranslation(["voting", "errors"]);

    const basicInfoForm = useForm<CreateVoteFormValues>({
        resolver: zodResolver(createVoteFormSchema),
        defaultValues: {
            title: initialData?.title ?? "",
            description: initialData?.description ?? "",
            scheduledFrom: initialData?.scheduledFrom ?? "",
            scheduledTo: initialData?.scheduledTo ?? "",
        },
    });

    useEffect(() => {
        if (initialData && !basicInfoForm.formState.isDirty) {
            basicInfoForm.reset({
                title: initialData.title ?? "",
                description: initialData.description ?? "",
                scheduledFrom: initialData.scheduledFrom ?? "",
                scheduledTo: initialData.scheduledTo ?? "",
            });
        }
    }, [initialData, basicInfoForm]);

    const createVoteMutation = useVotesControllerCreateVote();
    const updateVoteMutation = useVotesControllerUpdateVote();

    const isPending =
        createVoteMutation.isPending || updateVoteMutation.isPending;

    const { isDirty } = basicInfoForm.formState;

    useEffect(() => {
        onDirtyChange(isDirty);
        return () => onDirtyChange(false);
    }, [isDirty, onDirtyChange]);

    useEffect(() => {
        onSavingChange?.(isPending);
        return () => onSavingChange?.(false);
    }, [isPending, onSavingChange]);

    const onSubmit = (values: CreateVoteFormValues) => {
        const data = {
            title: values.title,
            description: values.description || undefined,
            scheduledFrom: values.scheduledFrom
                ? new Date(values.scheduledFrom).toISOString()
                : undefined,
            scheduledTo: values.scheduledTo
                ? new Date(values.scheduledTo).toISOString()
                : undefined,
        };

        if (voteId) {
            updateVoteMutation.mutate(
                { id: voteId, data },
                {
                    onSuccess: () => {
                        toast.success(t("voting:create.toast.updateSuccess"));
                        basicInfoForm.reset(values);
                        onSuccess(voteId);
                    },
                    onError: showApiError,
                },
            );
        } else {
            createVoteMutation.mutate(
                { data },
                {
                    onSuccess: (response) => {
                        toast.success(t("voting:create.toast.createSuccess"));
                        basicInfoForm.reset(values);
                        onSuccess(response.id);
                    },
                    onError: showApiError,
                },
            );
        }
    };

    const renderShortVotingPeriodWarning = () => {
        const from = basicInfoForm.watch("scheduledFrom");
        const to = basicInfoForm.watch("scheduledTo");
        if (from && to) {
            const days = differenceInDays(new Date(to), new Date(from));
            if (days < 15) {
                return (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                            {t("voting:create.fields.shortVotingPeriodWarning")}
                        </span>
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <FormProvider {...basicInfoForm}>
            <form
                id={formId}
                onSubmit={basicInfoForm.handleSubmit(onSubmit)}
                className="space-y-6"
            >
                <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight">
                        {t("create.steps.basicInfo.title")}
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                        {t("create.steps.basicInfo.description")}
                    </p>
                </div>
                <div className="space-y-4">
                    <FormInput
                        name="title"
                        label={t("voting:create.fields.title.label")}
                        placeholder={t(
                            "voting:create.fields.title.placeholder",
                        )}
                    />

                    <FormTextarea
                        name="description"
                        label={t("voting:create.fields.description.label")}
                        placeholder={t(
                            "voting:create.fields.description.placeholder",
                        )}
                        rows={3}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormDatetimePicker
                            name="scheduledFrom"
                            label={t(
                                "voting:create.fields.scheduledFrom.label",
                            )}
                            description={t(
                                "voting:create.fields.scheduledFrom.description",
                            )}
                            timeLabel={t("voting:create.fields.time")}
                        />

                        <FormDatetimePicker
                            name="scheduledTo"
                            label={t("voting:create.fields.scheduledTo.label")}
                            description={t(
                                "voting:create.fields.scheduledTo.description",
                            )}
                            timeLabel={t("voting:create.fields.time")}
                        />
                    </div>

                    {renderShortVotingPeriodWarning()}
                </div>
            </form>
        </FormProvider>
    );
}
