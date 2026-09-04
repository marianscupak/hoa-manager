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

import type { ConsentRisk } from "../utils/delegation-eligibility";
import { ConsentRiskNotice } from "./delegation/consent-risk-notice";

interface ConfirmDelegationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    unitName: string;
    delegateName: string;
    risk: ConsentRisk | null;
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
    risk,
    voteTitle,
    scheduledFrom,
    isPending,
}: ConfirmDelegationModalProps) => {
    const { t } = useTranslation("voting");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="shadow-clay-hero overflow-hidden border-none p-0 sm:max-w-[650px]">
                <div className="space-y-8 p-8">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-2xl">
                                {t("delegate.modal.title")}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-base">
                            {t("delegate.modal.description")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="hover:border-primary/50 hover:bg-primary/5 bg-muted/30 flex flex-col gap-3 rounded-xl border p-4 transition-all">
                            <div className="text-primary flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="text-2xs font-bold tracking-wider uppercase opacity-70">
                                    {t("delegate.modal.delegateLabel")}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="truncate font-bold">
                                    {delegateName}
                                </p>
                                <p className="text-faint text-2xs">
                                    {t("delegate.modal.delegateSubtext")}
                                </p>
                            </div>
                        </div>

                        <div className="hover:border-primary/50 hover:bg-primary/5 bg-muted/30 flex flex-col gap-3 rounded-xl border p-4 transition-all">
                            <div className="text-primary flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span className="text-2xs font-bold tracking-wider uppercase opacity-70">
                                    {t("delegate.modal.unitLabel")}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="truncate font-bold">{unitName}</p>
                                <p className="text-faint text-2xs">
                                    {t("delegate.modal.unitSubtext")}
                                </p>
                            </div>
                        </div>

                        <div className="hover:border-primary/50 hover:bg-primary/5 bg-muted/30 flex flex-col gap-3 rounded-xl border p-4 transition-all">
                            <div className="text-primary flex items-center gap-2">
                                <Vote className="h-4 w-4" />
                                <span className="text-2xs font-bold tracking-wider uppercase opacity-70">
                                    {t("delegate.modal.eventLabel")}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="truncate font-bold">
                                    {voteTitle}
                                </p>
                                <p className="text-faint text-2xs">
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

                    <ConsentRiskNotice risk={risk} />

                    <div className="border-primary-tint-border bg-primary-tint flex gap-4 rounded-xl border p-5">
                        <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-primary-tint-foreground font-bold">
                                {t("delegate.modal.revocableTitle")}
                            </p>
                            <p className="text-primary-tint-foreground/80 text-sm leading-relaxed">
                                {t("delegate.modal.revocableDescription")}
                            </p>
                        </div>
                    </div>

                    <p className="text-faint px-4 text-center text-xs leading-relaxed">
                        {t("delegate.modal.terms")}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isPending}
                            className="h-12 flex-1"
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isPending}
                            className="h-12 flex-[2] text-base"
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
