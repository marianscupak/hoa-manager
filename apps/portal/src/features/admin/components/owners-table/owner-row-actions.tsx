import { useQueryClient } from "@tanstack/react-query";
import { MailPlusIcon, SendIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, toast } from "@hoa-mngr/ui";

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
        <div className="flex items-center justify-end gap-2">
            {!row.userId && !row.email && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddEmail(row)}
                >
                    <MailPlusIcon className="h-3.5 w-3.5" />
                    {t("owners.addEmail.action")}
                </Button>
            )}
            {!row.userId && row.email && (
                <>
                    {row.inviteStatus === "pending" && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    sendInvite.mutate({ ownerId: row.id })
                                }
                                disabled={isSending}
                            >
                                <SendIcon className="h-3.5 w-3.5" />
                                {isSending
                                    ? t("owners.invite.sending")
                                    : t("owners.invite.resend")}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() =>
                                    revokeInvite.mutate({ ownerId: row.id })
                                }
                                disabled={isRevoking}
                            >
                                <XIcon className="h-3.5 w-3.5" />
                                {t("owners.invite.revoke")}
                            </Button>
                        </>
                    )}
                    {row.inviteStatus === "expired" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                sendInvite.mutate({ ownerId: row.id })
                            }
                            disabled={isSending}
                        >
                            <SendIcon className="h-3.5 w-3.5" />
                            {isSending
                                ? t("owners.invite.sending")
                                : t("owners.invite.resend")}
                        </Button>
                    )}
                    {!row.inviteStatus && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                sendInvite.mutate({ ownerId: row.id })
                            }
                            disabled={isSending}
                        >
                            <SendIcon className="h-3.5 w-3.5" />
                            {isSending
                                ? t("owners.invite.sending")
                                : t("owners.invite.send")}
                        </Button>
                    )}
                </>
            )}
            <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                onClick={() => onDelete(row)}
            >
                <Trash2Icon />
            </Button>
        </div>
    );
}
