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
import { getPeopleControllerGetPeopleQueryKey } from "@/api/generated/people/people";
import {
    useOwnerControllerRevokeInvite,
    useOwnerControllerSendInvite,
    useOwnerControllerUnlinkAccount,
} from "@/api/generated/property-owners/property-owners";

import { type PersonRow } from "../utils/people-filter";

interface PersonRowActionsProps {
    person: PersonRow;
    /** Deleting an owner is ADMIN-only, as the endpoint already enforces. */
    isAdmin: boolean;
    onDelete: (person: PersonRow) => void;
    onAddEmail: (person: PersonRow) => void;
    onLink: (person: PersonRow) => void;
}

/**
 * The owner-side actions, gathered from the two tables this screen replaces.
 *
 * Changing a role is not here: it lives in the Access column, because it is
 * that column's fact and its control at once.
 */
export function PersonRowActions({
    person,
    isAdmin,
    onDelete,
    onAddEmail,
    onLink,
}: PersonRowActionsProps) {
    const { t } = useTranslation(["admin"]);
    const queryClient = useQueryClient();

    const refresh = () =>
        queryClient.invalidateQueries({
            queryKey: getPeopleControllerGetPeopleQueryKey(),
        });

    const mutation = (successKey: string) => ({
        mutation: {
            onSuccess: () => {
                toast.success(t(successKey as "owners.invite.success"));
                void refresh();
            },
            onError: showApiError,
        },
    });

    const sendInvite = useOwnerControllerSendInvite(
        mutation("owners.invite.success"),
    );
    const revokeInvite = useOwnerControllerRevokeInvite(
        mutation("owners.invite.revokeSuccess"),
    );
    const unlink = useOwnerControllerUnlinkAccount(
        mutation("people.unlink.success"),
    );

    // An account-only row has nothing to act on: it is a membership, and the
    // only thing to do with one is change its role.
    if (!person.ownerId) return null;
    const ownerId = person.ownerId;

    const inviteLabel = sendInvite.isPending
        ? t("owners.invite.sending")
        : person.inviteStatus
          ? t("owners.invite.resend")
          : t("owners.invite.send");

    return (
        <div className="flex items-center justify-end gap-1.5">
            {!person.membershipId && !person.email && (
                <Button
                    variant="tableAction"
                    size="tableText"
                    onClick={() => onAddEmail(person)}
                >
                    {t("owners.addEmail.action")}
                </Button>
            )}

            {!person.membershipId && person.email && (
                <>
                    <Button
                        variant="tableAction"
                        size="tableText"
                        onClick={() => sendInvite.mutate({ ownerId })}
                        disabled={sendInvite.isPending}
                    >
                        {inviteLabel}
                    </Button>
                    {person.inviteStatus === "pending" && (
                        <Button
                            variant="tableActionDanger"
                            size="tableText"
                            className="text-destructive"
                            onClick={() => revokeInvite.mutate({ ownerId })}
                            disabled={revokeInvite.isPending}
                        >
                            {t("owners.invite.revoke")}
                        </Button>
                    )}
                </>
            )}

            {!person.membershipId && (
                <Button
                    variant="tableAction"
                    size="tableText"
                    onClick={() => onLink(person)}
                >
                    {t("people.link.action")}
                </Button>
            )}

            {person.membershipId && (
                <Button
                    variant="tableAction"
                    size="tableText"
                    onClick={() => unlink.mutate({ ownerId })}
                    disabled={unlink.isPending}
                >
                    {t("people.unlink.action")}
                </Button>
            )}

            {isAdmin &&
                (person.hasOwnershipRecords ? (
                    <TooltipProvider>
                        <Tooltip>
                            {/* A disabled control fires no pointer events, so
                                the span carries the tooltip. */}
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
                        onClick={() => onDelete(person)}
                    >
                        <Trash2Icon />
                    </Button>
                ))}
        </div>
    );
}
