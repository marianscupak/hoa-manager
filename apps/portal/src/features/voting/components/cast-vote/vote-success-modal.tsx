import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, Dialog, DialogContent } from "@hoa-mngr/ui";

interface VoteSuccessModalProps {
    open: boolean;
    onClose: () => void;
    submittedAt: string | null;
}

export function VoteSuccessModal({
    open,
    onClose,
    submittedAt,
}: VoteSuccessModalProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="border-none p-0 shadow-2xl sm:max-w-[450px]">
                <div className="flex flex-col items-center gap-6 p-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle className="h-10 w-10 text-emerald-500" />
                    </div>

                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-900">
                            {t("voting:castVote.success.title")}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t("voting:castVote.success.subtitle")}
                        </p>
                    </div>

                    {submittedAt && (
                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm font-medium text-slate-600">
                                    {t("voting:castVote.success.timestamp")}
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                    {format(
                                        new Date(submittedAt),
                                        "d. M. yyyy HH:mm",
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={onClose}
                    >
                        {t("voting:castVote.success.backToDashboard")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
