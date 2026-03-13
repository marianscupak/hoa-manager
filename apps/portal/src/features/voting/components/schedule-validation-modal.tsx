import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@hoa-mngr/ui";

interface ScheduleValidationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    errors: { code: string; param?: string }[];
    voteId: string;
    isAlreadyOnEditPage?: boolean;
}

export function ScheduleValidationModal({
    open,
    onOpenChange,
    errors,
    voteId,
    isAlreadyOnEditPage = false,
}: ScheduleValidationModalProps) {
    const { t } = useTranslation(["voting"]);
    const navigate = useNavigate();

    const handleGoToEdit = () => {
        onOpenChange(false);
        navigate(`/voting/${voteId}/edit`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="text-destructive mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <DialogTitle>
                            {t("voting:detail.validation.title")}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {t("voting:detail.validation.description")}
                    </DialogDescription>
                </DialogHeader>

                <ul className="space-y-2 py-4">
                    {errors.map((error, index) => (
                        <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-slate-700"
                        >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                            <span>
                                {t(
                                    `voting:detail.validation.errors.${error.code}`,
                                    {
                                        param: error.param,
                                        defaultValue: error.code,
                                    },
                                )}
                            </span>
                        </li>
                    ))}
                </ul>

                <DialogFooter className="flex gap-2 sm:justify-between">
                    {!isAlreadyOnEditPage ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1"
                            >
                                {t("voting:detail.validation.close")}
                            </Button>
                            <Button onClick={handleGoToEdit} className="flex-1">
                                {t("voting:detail.validation.goToEdit")}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="w-full"
                        >
                            {t("voting:detail.validation.close")}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
