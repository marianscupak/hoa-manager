import { format } from "date-fns";
import { Building2, Check, ShieldCheck, User, Vote } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@hoa-mngr/ui";

interface ConfirmDelegationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    unitName: string;
    delegateName: string;
    voteTitle: string;
    scheduledFrom?: string | Date | null;
    isPending: boolean;
}

export const ConfirmDelegationModal = ({
    isOpen,
    onClose,
    onConfirm,
    unitName,
    delegateName,
    voteTitle,
    scheduledFrom,
    isPending,
}: ConfirmDelegationModalProps) => {
    const { t } = useTranslation("voting");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[650px]">
                <div className="space-y-8 p-8">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-2xl font-bold text-slate-900">
                                {t("delegate.modal.title")}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-base text-slate-500">
                            {t("delegate.modal.description")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30">
                            <div className="flex items-center gap-2 text-blue-600">
                                <User className="h-4 w-4" />
                                <span className="text-[10px] font-bold tracking-wider uppercase opacity-70">
                                    {t("delegate.modal.delegateLabel")}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="truncate font-bold text-slate-900">
                                    {delegateName}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    {t("delegate.modal.delegateSubtext")}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Building2 className="h-4 w-4" />
                                <span className="text-[10px] font-bold tracking-wider uppercase opacity-70">
                                    {t("delegate.modal.unitLabel")}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="truncate font-bold text-slate-900">
                                    {unitName}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    {t("delegate.modal.unitSubtext")}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Vote className="h-4 w-4" />
                                <span className="text-[10px] font-bold tracking-wider uppercase opacity-70">
                                    {t("delegate.modal.eventLabel")}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="truncate font-bold text-slate-900">
                                    {voteTitle}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    {scheduledFrom
                                        ? format(
                                              new Date(scheduledFrom),
                                              "d. M. yyyy HH:mm",
                                          )
                                        : t("delegate.modal.eventSubtext")}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 rounded-xl border border-blue-100 bg-blue-50/80 p-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-200">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-blue-900">
                                {t("delegate.modal.revocableTitle")}
                            </p>
                            <p className="text-sm leading-relaxed text-blue-700/80">
                                {t("delegate.modal.revocableDescription")}
                            </p>
                        </div>
                    </div>

                    <p className="px-4 text-center text-xs leading-relaxed text-slate-400">
                        {t("delegate.modal.terms")}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isPending}
                            className="h-12 flex-1 border-rose-100 bg-rose-50/30 font-bold text-rose-600 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isPending}
                            className="h-12 flex-[2] bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
                        >
                            {isPending ? (
                                t("delegate.confirming")
                            ) : (
                                <span className="flex items-center gap-2">
                                    {t("delegate.modal.allowAction")}
                                    <Check className="h-5 w-5" />
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
