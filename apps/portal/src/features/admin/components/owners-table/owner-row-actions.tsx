import { SendIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { OwnerResponseDto } from "@/api/generated/model";
import {
    useOwnerControllerRevokeInvite,
    useOwnerControllerSendInvite,
} from "@/api/generated/property-owners/property-owners";

interface OwnerRowActionsProps {
    row: OwnerResponseDto;
    onSuccess: () => void;
}

export function OwnerRowActions({ row, onSuccess }: OwnerRowActionsProps) {
    const { t } = useTranslation(["admin"]);

    const sendInvite = useOwnerControllerSendInvite({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.invite.success"));
                onSuccess();
            },
            onError: showApiError,
        },
    });

    const revokeInvite = useOwnerControllerRevokeInvite({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.invite.revokeSuccess"));
                onSuccess();
            },
            onError: showApiError,
        },
    });

    if (row.userId || !row.email) return null;

    const isSending = sendInvite.isPending;
    const isRevoking = revokeInvite.isPending;

    if (row.inviteStatus === "pending") {
        return (
            <div className="flex items-center gap-2">
                <span className="inline-flex h-8 items-center rounded-md bg-amber-50 px-2.5 text-xs leading-none font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                    {t("owners.invite.statusPending")}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => sendInvite.mutate({ ownerId: row.id })}
                    disabled={isSending}
                >
                    <SendIcon className="mr-1.5 h-3.5 w-3.5" />
                    {isSending
                        ? t("owners.invite.sending")
                        : t("owners.invite.resend")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive/80 border-destructive/20 h-8"
                    onClick={() => revokeInvite.mutate({ ownerId: row.id })}
                    disabled={isRevoking}
                >
                    <XIcon className="mr-1.5 h-3.5 w-3.5" />
                    {t("owners.invite.revoke")}
                </Button>
            </div>
        );
    }

    if (row.inviteStatus === "expired") {
        return (
            <div className="flex items-center gap-2">
                <span className="bg-destructive-muted text-destructive ring-destructive/20 inline-flex h-8 items-center rounded-md px-2.5 text-xs leading-none font-medium ring-1 ring-inset">
                    {t("owners.invite.statusExpired")}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => sendInvite.mutate({ ownerId: row.id })}
                    disabled={isSending}
                >
                    <SendIcon className="mr-1.5 h-3.5 w-3.5" />
                    {isSending
                        ? t("owners.invite.sending")
                        : t("owners.invite.resend")}
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => sendInvite.mutate({ ownerId: row.id })}
            disabled={isSending}
        >
            <SendIcon className="mr-1.5 h-3.5 w-3.5" />
            {isSending ? t("owners.invite.sending") : t("owners.invite.send")}
        </Button>
    );
}
