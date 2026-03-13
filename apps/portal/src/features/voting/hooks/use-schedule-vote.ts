import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { showApiError } from "@/api/error-utils";
import { useVotesControllerScheduleVote } from "@/api/generated/votes/votes";

export function useScheduleVote(
    voteId: string,
    options?: { onSuccess?: () => void },
) {
    const { t } = useTranslation(["voting"]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isValidationOpen, setIsValidationOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<
        { code: string; param?: string }[]
    >([]);

    const scheduleMutation = useVotesControllerScheduleVote();

    const handleSchedule = () => {
        if (!voteId) return;
        scheduleMutation.mutate(
            { id: voteId },
            {
                onSuccess: () => {
                    toast.success(t("voting:create.toast.scheduleSuccess"));
                    setIsConfirmOpen(false);
                    options?.onSuccess?.();
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (error: any) => {
                    const errorData = error.response?.data;
                    if (errorData?.code === "INCOMPLETE_VOTE") {
                        setValidationErrors(errorData.details || []);
                        setIsConfirmOpen(false);
                        setIsValidationOpen(true);
                        return;
                    }
                    showApiError(error);
                },
            },
        );
    };

    return {
        handleSchedule,
        isConfirmOpen,
        setIsConfirmOpen,
        isValidationOpen,
        setIsValidationOpen,
        validationErrors,
        isPending: scheduleMutation.isPending,
    };
}
