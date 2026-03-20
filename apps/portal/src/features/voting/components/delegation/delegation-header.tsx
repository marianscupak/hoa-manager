import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

interface DelegationHeaderProps {
    voteTitle: string;
    scheduledFrom?: string | Date | null;
    onBack: () => void;
}

export const DelegationHeader = ({
    voteTitle,
    scheduledFrom,
    onBack,
}: DelegationHeaderProps) => {
    const { t } = useTranslation("voting");

    return (
        <div className="mb-6 flex items-center justify-between border-b pb-6">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="text-muted-foreground mb-2 -ml-2"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("delegate.backToVote")}
                </Button>
                <h1 className="mb-2 text-3xl font-bold tracking-tight">
                    {t("delegate.title")}
                </h1>
                <p className="text-muted-foreground flex items-center">
                    <span className="mr-2 font-medium">
                        {t("delegate.votingEvent")}:
                    </span>
                    {voteTitle} —{" "}
                    {scheduledFrom &&
                        format(new Date(scheduledFrom), "d. M. yyyy HH:mm")}
                </p>
            </div>
        </div>
    );
};
