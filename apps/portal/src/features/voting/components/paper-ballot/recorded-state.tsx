import { format, isValid } from "date-fns";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

export interface RecordedStateProps {
    unitNo: string;
    signerName: string;
    actorName: string;
    submittedAt: string;
    onRecordAnother: () => void;
    onBackToVote: () => void;
}

export function RecordedState({
    unitNo,
    signerName,
    actorName,
    submittedAt,
    onRecordAnother,
    onBackToVote,
}: RecordedStateProps) {
    const { t } = useTranslation("voting");
    const recorded = new Date(submittedAt);

    return (
        <div className="mx-auto flex max-w-lg flex-col items-center py-12 text-center">
            <div className="bg-success-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                <ShieldCheck className="text-success-tint-foreground h-10 w-10" />
            </div>
            <h1 className="font-display text-foreground mb-2 text-2xl font-extrabold tracking-tight">
                {t("paperBallot.done.title", { unit: unitNo })}
            </h1>
            <p className="text-muted-foreground mb-6 text-sm">
                {t("paperBallot.done.body", {
                    actor: actorName,
                    signer: signerName,
                })}
            </p>
            {isValid(recorded) && (
                <div className="border-hairline rounded-panel bg-muted/50 mb-8 flex w-full items-center justify-between border px-4 py-3">
                    <span className="text-secondary-foreground text-sm font-medium">
                        {t("paperBallot.done.recordedAt")}
                    </span>
                    <span className="text-foreground text-sm font-bold">
                        {format(recorded, "d. M. yyyy HH:mm")}
                    </span>
                </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button onClick={onRecordAnother}>
                    <FileText />
                    {t("paperBallot.done.another")}
                </Button>
                <Button variant="outline" onClick={onBackToVote}>
                    <ArrowLeft />
                    {t("paperBallot.done.backToVote")}
                </Button>
            </div>
        </div>
    );
}
