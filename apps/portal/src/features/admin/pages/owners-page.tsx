import { MailIcon, PlusIcon, SendIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, DataTable, ColumnDef, toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { OwnerResponseDto } from "@/api/generated/model";
import {
    useOwnerControllerGetOwners,
    useOwnerControllerSendInvite,
    useOwnerControllerRevokeInvite,
} from "@/api/generated/property-owners/property-owners";

import { CreateOwnerDialog } from "../components/create-owner-dialog";

export function OwnersPage() {
    const { t } = useTranslation(["admin"]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: owners, isLoading, refetch } = useOwnerControllerGetOwners();

    const sendInvite = useOwnerControllerSendInvite({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.invite.success"));
                refetch();
            },
            onError: showApiError,
        },
    });

    const revokeInvite = useOwnerControllerRevokeInvite({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.invite.revokeSuccess"));
                refetch();
            },
            onError: showApiError,
        },
    });

    const columns: ColumnDef<OwnerResponseDto>[] = [
        {
            header: t("owners.table.displayName"),
            accessorKey: "displayName",
            className: "font-medium",
        },
        {
            header: t("owners.table.email"),
            cell: ({ row }) =>
                row.email ? (
                    <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <MailIcon className="h-3.5 w-3.5" />
                        {row.email}
                    </span>
                ) : (
                    <span className="text-muted-foreground/50 text-sm">—</span>
                ),
        },
        {
            header: t("owners.table.userAccount"),
            cell: ({ row }) =>
                row.userId ? (
                    <span className="bg-success-muted text-success ring-success/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                        {t("owners.table.linked")}
                    </span>
                ) : (
                    <span className="bg-muted text-muted-foreground ring-border inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                        {t("owners.table.unlinked")}
                    </span>
                ),
        },
        {
            header: "",
            cell: ({ row }) => {
                if (row.userId || !row.email) return null;

                const isSending =
                    sendInvite.isPending &&
                    sendInvite.variables?.ownerId === row.id;

                const isRevoking =
                    revokeInvite.isPending &&
                    revokeInvite.variables?.ownerId === row.id;

                if (row.inviteStatus === "pending") {
                    return (
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                                {t("owners.invite.statusPending")}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    sendInvite.mutate({ ownerId: row.id })
                                }
                                disabled={isSending}
                            >
                                <SendIcon className="mr-1.5 h-3.5 w-3.5" />
                                {isSending
                                    ? t("owners.invite.sending")
                                    : t("owners.invite.resend")}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    revokeInvite.mutate({ ownerId: row.id })
                                }
                                disabled={isRevoking}
                                className="text-destructive hover:text-destructive/80"
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
                            <span className="bg-destructive-muted text-destructive ring-destructive/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                                {t("owners.invite.statusExpired")}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    sendInvite.mutate({ ownerId: row.id })
                                }
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
                        onClick={() => sendInvite.mutate({ ownerId: row.id })}
                        disabled={isSending}
                    >
                        <SendIcon className="mr-1.5 h-3.5 w-3.5" />
                        {isSending
                            ? t("owners.invite.sending")
                            : t("owners.invite.send")}
                    </Button>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">
                        {t("owners.title")}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {t("owners.description")}
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    {t("owners.addOwner")}
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={owners ?? []}
                isLoading={isLoading}
                emptyMessage={t("owners.empty")}
            />

            <CreateOwnerDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={refetch}
            />
        </div>
    );
}
