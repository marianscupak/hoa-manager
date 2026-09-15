import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInDays } from "date-fns";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
    FormDatetimePicker,
    FormInput,
    FormTextarea,
    toast,
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

/** Mirrors `PER_ROLLAM_MIN_WINDOW_MS` in the server's vote aggregate. */
const PER_ROLLAM_MIN_DAYS = 15;

/**
 * Both date rules live here rather than in the review checklist, so the chair
 * finds out on the step where the dates are entered. The server stays
 * authoritative — `assertSchedulable` re-checks both.
 *
 * The ordering rule applies to every mode. The 15-day floor is per rollam
 * only: an assembly record captures when a meeting happened, not how long
 * owners had to respond.
 */
export function buildFormSchema(mode: "PER_ROLLAM" | "ASSEMBLY_RECORD") {
    return createVoteFormSchema.superRefine((values, ctx) => {
        if (!values.scheduledFrom || !values.scheduledTo) return;

        if (new Date(values.scheduledTo) <= new Date(values.scheduledFrom)) {
            ctx.addIssue({
                code: "custom",
                path: ["scheduledTo"],
                message: "voting:create.fields.scheduledTo.errors.beforeStart",
            });
            return;
        }

        if (mode !== "PER_ROLLAM") return;

        const days = differenceInDays(
            new Date(values.scheduledTo),
            new Date(values.scheduledFrom),
        );
        if (days < PER_ROLLAM_MIN_DAYS) {
            ctx.addIssue({
                code: "custom",
                path: ["scheduledTo"],
                message:
                    "voting:create.fields.scheduledTo.errors.tooShortPerRollam",
            });
        }
    });
}

export interface CreateVoteBasicInfoStepProps {
    onSuccess: (id: string) => void;
    voteId?: string | null;
    /**
     * The mode chosen in the (preceding) mode step. Only sent when creating
     * a new vote — mode is immutable after creation, so an update to an
     * existing draft never includes it (the field is optional on
     * UpdateVoteDto for exactly this reason).
     */
    mode: "PER_ROLLAM" | "ASSEMBLY_RECORD";
    initialData?: VoteDetailResponseDto;
    /** Id the wizard footer's Continue button submits via `form={formId}`. */
    formId: string;
    onDirtyChange: (dirty: boolean) => void;
    onSavingChange?: (saving: boolean) => void;
}

export function CreateVoteBasicInfoStep({
    onSuccess,
    voteId,
    mode,
    initialData,
    formId,
    onDirtyChange,
    onSavingChange,
}: CreateVoteBasicInfoStepProps) {
    const { t } = useTranslation(["voting", "errors"]);

    // Mode is immutable once the vote exists, so the schema only ever needs
    // building once per step.
    const schema = useMemo(() => buildFormSchema(mode), [mode]);

    const basicInfoForm = useForm<CreateVoteFormValues>({
        resolver: zodResolver(schema),
        // The per-rollam window error has to land the moment both dates are
        // set, the way the advisory banner it replaced did. On the default
        // `onSubmit` the chair would only find out after clicking Continue.
        mode: "onChange",
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
                { data: { ...data, mode } },
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
                        optional
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
            </form>
        </FormProvider>
    );
}
