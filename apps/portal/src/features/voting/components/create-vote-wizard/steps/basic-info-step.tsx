import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button, FormDatetimePicker, FormInput } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { useVotesControllerCreateVote } from "@/api/generated/votes/votes";

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
}

export function CreateVoteBasicInfoStep({
    onSuccess,
    isSaved,
}: CreateVoteBasicInfoStepProps) {
    const { t } = useTranslation(["voting", "errors"]);

    const basicInfoForm = useForm<CreateVoteFormValues>({
        resolver: zodResolver(createVoteFormSchema),
        defaultValues: {
            title: "",
            description: "",
            scheduledFrom: "",
            scheduledTo: "",
        },
    });

    const createVoteMutation = useVotesControllerCreateVote();

    const onSubmit = (values: CreateVoteFormValues) => {
        createVoteMutation.mutate(
            {
                data: {
                    title: values.title,
                    description: values.description || undefined,
                    scheduledFrom: values.scheduledFrom
                        ? new Date(values.scheduledFrom).toISOString()
                        : undefined,
                    scheduledTo: values.scheduledTo
                        ? new Date(values.scheduledTo).toISOString()
                        : undefined,
                },
            },
            {
                onSuccess: (response) => {
                    toast.success(t("voting:create.toast.success"));
                    onSuccess(response.id);
                },
                onError: showApiError,
            },
        );
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

                    <FormInput
                        name="description"
                        label={t("voting:create.fields.description.label")}
                        placeholder={t(
                            "voting:create.fields.description.placeholder",
                        )}
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
                        disabled={createVoteMutation.isPending || isSaved}
                    >
                        {createVoteMutation.isPending
                            ? "..."
                            : isSaved
                              ? t("voting:create.actions.saved")
                              : t("voting:create.actions.saveNext")}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
