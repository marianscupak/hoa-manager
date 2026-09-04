import { useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    Button,
    toast,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { OwnerResponseDto } from "@/api/generated/model";
import {
    getOwnerControllerGetOwnersQueryKey,
    useOwnerControllerRevokeInvite,
    useOwnerControllerSendInvite,
} from "@/api/generated/property-owners/property-owners";

interface OwnerRowActionsProps {
    row: OwnerResponseDto;
    onSuccess: () => void;
    onDelete: (owner: OwnerResponseDto) => void;
    onAddEmail: (owner: OwnerResponseDto) => void;
}

export function OwnerRowActions({
    row,
    onSuccess,
    onDelete,
    onAddEmail,
}: OwnerRowActionsProps) {
    const { t } = useTranslation(["admin"]);
    const queryClient = useQueryClient();

    const sendInvite = useOwnerControllerSendInvite({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.invite.success"));
                queryClient.invalidateQueries({
                    queryKey: getOwnerControllerGetOwnersQueryKey(),
                });
                onSuccess();
            },
            onError: showApiError,
        },
    });

    const revokeInvite = useOwnerControllerRevokeInvite({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.invite.revokeSuccess"));
                queryClient.invalidateQueries({
                    queryKey: getOwnerControllerGetOwnersQueryKey(),
                });
                onSuccess();
            },
            onError: showApiError,
        },
    });

    const isSending = sendInvite.isPending;
    const isRevoking = revokeInvite.isPending;

    return (
        <div className="flex items-center justify-end gap-1.5">
            {!row.userId && !row.email && (
                <Button
                    variant="tableAction"
                    size="tableText"
                    onClick={() => onAddEmail(row)}
                >
                    {t("owners.addEmail.action")}
                </Button>
            )}
            {!row.userId && row.email && (
                <>
                    {row.inviteStatus === "pending" && (
                        <>
                            <Button
                                variant="tableAction"
                                size="tableText"
                                onClick={() =>
                                    sendInvite.mutate({ ownerId: row.id })
                                }
                                disabled={isSending}
                            >
                                {isSending
                                    ? t("owners.invite.sending")
                                    : t("owners.invite.resend")}
                            </Button>
                            <Button
                                variant="tableActionDanger"
                                size="tableText"
                                className="text-destructive"
                                onClick={() =>
                                    revokeInvite.mutate({ ownerId: row.id })
                                }
                                disabled={isRevoking}
                            >
                                {t("owners.invite.revoke")}
                            </Button>
                        </>
                    )}
                    {row.inviteStatus === "expired" && (
                        <Button
                            variant="tableAction"
                            size="tableText"
                            onClick={() =>
                                sendInvite.mutate({ ownerId: row.id })
                            }
                            disabled={isSending}
                        >
                            {isSending
                                ? t("owners.invite.sending")
                                : t("owners.invite.resend")}
                        </Button>
                    )}
                    {!row.inviteStatus && (
                        <Button
                            variant="tableAction"
                            size="tableText"
                            onClick={() =>
                                sendInvite.mutate({ ownerId: row.id })
                            }
                            disabled={isSending}
                        >
                            {isSending
                                ? t("owners.invite.sending")
                                : t("owners.invite.send")}
                        </Button>
                    )}
                </>
            )}
            {row.hasOwnershipRecords ? (
                <TooltipProvider>
                    <Tooltip>
                        {/* A disabled control fires no pointer events, so the
                            span carries the tooltip (same trick as the
                            last-admin guard in user-row-actions). */}
                        <TooltipTrigger asChild>
                            <span className="inline-flex">
                                <Button
                                    variant="tableActionDanger"
                                    size="tableIcon"
                                    aria-label={t("owners.delete.title")}
                                    disabled
                                >
                                    <Trash2Icon />
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t("owners.delete.blockedHint")}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                <Button
                    variant="tableActionDanger"
                    size="tableIcon"
                    aria-label={t("owners.delete.title")}
                    onClick={() => onDelete(row)}
                >
                    <Trash2Icon />
                </Button>
            )}
        </div>
    );
}
