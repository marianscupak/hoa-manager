import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import {
    Button,
    FormDatetimePicker,
    FormInput,
    FormTextarea,
} from "@hoa-mngr/ui";

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
    isSaved: boolean;
    voteId?: string | null;
    initialData?: VoteDetailResponseDto;
}

export function CreateVoteBasicInfoStep({
    onSuccess,
    isSaved,
    voteId,
    initialData,
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

    return (
        <FormProvider {...basicInfoForm}>
            <form
                onSubmit={basicInfoForm.handleSubmit(onSubmit)}
                className="space-y-6"
            >
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
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={isPending || (isSaved && !voteId)}
                    >
                        {isPending
                            ? "..."
                            : isSaved && !voteId
                              ? t("voting:create.actions.saved")
                              : t("voting:create.actions.saveNext")}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
