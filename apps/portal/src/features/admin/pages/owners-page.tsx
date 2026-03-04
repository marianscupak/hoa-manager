import { MailIcon, PlusIcon, SendIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, DataTable, ColumnDef, toast } from "@hoa-mngr/ui";

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
            onError: () => {
                toast.error(t("owners.invite.error"));
            },
        },
    });

    const revokeInvite = useOwnerControllerRevokeInvite({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.invite.revokeSuccess"));
                refetch();
            },
            onError: () => {
                toast.error(t("owners.invite.revokeError"));
            },
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
                    <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MailIcon className="h-3.5 w-3.5" />
                        {row.email}
                    </span>
                ) : (
                    <span className="text-sm text-slate-400">—</span>
                ),
        },
        {
            header: t("owners.table.userAccount"),
            cell: ({ row }) =>
                row.userId ? (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                        {t("owners.table.linked")}
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-500/10 ring-inset">
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
                                className="text-red-600 hover:text-red-700"
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
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/20 ring-inset">
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
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {t("owners.title")}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
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
