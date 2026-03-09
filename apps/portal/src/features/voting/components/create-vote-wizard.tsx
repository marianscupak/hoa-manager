import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@hoa-mngr/ui";

import { useVotesControllerCreateVote } from "@/api/generated/votes/votes";

import { CreateVoteBasicInfoStep } from "./steps/basic-info-step";

export const createVoteFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    scheduledFrom: z.string().optional(),
    scheduledTo: z.string().optional(),
});

export type CreateVoteFormValues = z.infer<typeof createVoteFormSchema>;

export function CreateVoteWizard() {
    const { t } = useTranslation(["voting", "errors"]);
    const navigate = useNavigate();

    const form = useForm<CreateVoteFormValues>({
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
                    description: values.description || "",
                    scheduledFrom: values.scheduledFrom
                        ? new Date(values.scheduledFrom).toISOString()
                        : undefined,
                    scheduledTo: values.scheduledTo
                        ? new Date(values.scheduledTo).toISOString()
                        : undefined,
                },
            },
            {
                onSuccess: () => {
                    toast.success(
                        t(
                            "voting:create.toast.success",
                            "Vote created successfully",
                        ),
                    );
                    navigate("/voting");
                },
                onError: (error) => {
                    console.error("Failed to create vote", error);
                    toast.error(
                        t("voting:create.toast.error", "Failed to create vote"),
                    );
                },
            },
        );
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("voting:create.title", "Create Vote")}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t(
                        "voting:create.description",
                        "Set up a new vote for the association.",
                    )}
                </p>
            </div>

            <div className="bg-card rounded-lg border p-6 shadow-sm">
                <div className="mb-6 border-b pb-4">
                    <h2 className="text-xl font-semibold">
                        {t(
                            "voting:create.steps.basicInfo.title",
                            "Basic Information",
                        )}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {t(
                            "voting:create.steps.basicInfo.description",
                            "Provide the primary details for this vote.",
                        )}
                    </p>
                </div>

                <FormProvider {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <CreateVoteBasicInfoStep />

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={createVoteMutation.isPending}
                            >
                                {createVoteMutation.isPending
                                    ? "..."
                                    : t(
                                          "voting:create.actions.submit",
                                          "Create Vote",
                                      )}
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
}
