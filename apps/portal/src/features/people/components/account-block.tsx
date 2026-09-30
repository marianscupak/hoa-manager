import { format, formatDistanceToNow } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { LinkIcon, SendIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Button,
    ConfirmDialog,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    StatusChip,
    toast,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { MemberResponseDtoRole } from "@/api/generated/model/memberResponseDtoRole";
import {
    useOwnerControllerRevokeInvite,
    useOwnerControllerSendInvite,
    useOwnerControllerUnlinkAccount,
} from "@/api/generated/property-owners/property-owners";
import {
    useMemberControllerChangeMemberStatus,
    useMemberControllerUpdateMemberRole,
} from "@/api/generated/tenant-members/tenant-members";

import { accountGuards, addressName } from "../utils/person-status";
import { type PersonRow } from "../utils/people-filter";
import { LinkAccountDialog } from "./link-account-dialog";
import { BlockSection, Field, FieldList, PersonBlock } from "./person-block";
import { PersonStatusChip } from "./person-status-chip";

const formatDay = (iso: string) => format(new Date(iso), "d. M. yyyy");

interface AccountBlockProps {
    person: PersonRow;
    /** Everyone in the association, to pick an account to link out of. */
    people: PersonRow[];
    /** Role and suspension are ADMIN-only, as the endpoints enforce. */
    isAdmin: boolean;
    /** True when this association has exactly one active ADMIN left. */
    isLastAdmin: boolean;
    /** The viewer's own membership: an admin cannot suspend themselves. */
    currentMembershipId?: string;
    onAddEmail: () => void;
    onChanged: () => void;
}

/** The person as the portal knows them: whether and how they can sign in. */
export function AccountBlock({
    person,
    people,
    isAdmin,
    isLastAdmin,
    currentMembershipId,
    onAddEmail,
    onChanged,
}: AccountBlockProps) {
    const { t, i18n } = useTranslation(["admin"]);
    const locale = i18n.language === "cs" ? cs : enUS;
    const [confirmSuspend, setConfirmSuspend] = useState(false);
    const [linking, setLinking] = useState(false);

    const succeed = (message: string) => {
        toast.success(message);
        onChanged();
    };

    const changeStatus = useMemberControllerChangeMemberStatus({
        mutation: {
            onSuccess: (_data, { data }) => {
                setConfirmSuspend(false);
                succeed(
                    data.status === "SUSPENDED"
                        ? t("users.suspend.success")
                        : t("users.restore.success"),
                );
            },
            onError: showApiError,
        },
    });
    const updateRole = useMemberControllerUpdateMemberRole({
        mutation: {
            onSuccess: () => succeed(t("users.updateRole.success")),
            onError: showApiError,
        },
    });
    const sendInvite = useOwnerControllerSendInvite({
        mutation: {
            onSuccess: () => succeed(t("owners.invite.success")),
            onError: showApiError,
        },
    });
    const revokeInvite = useOwnerControllerRevokeInvite({
        mutation: {
            onSuccess: () => succeed(t("owners.invite.revokeSuccess")),
            onError: showApiError,
        },
    });
    const unlink = useOwnerControllerUnlinkAccount({
        mutation: {
            onSuccess: () => succeed(t("people.unlink.success")),
            onError: showApiError,
        },
    });

    const blockProps = {
        icon: UserIcon,
        title: t("people.detail.account.title"),
        caption: t("people.detail.account.caption"),
    };

    if (person.membershipId) {
        const membershipId = person.membershipId;
        const guards = accountGuards(person, {
            isAdmin,
            isLastAdmin,
            currentMembershipId,
        });
        const hasFooter =
            guards.canSuspend ||
            guards.canRestore ||
            !!person.ownerId ||
            (isAdmin && guards.isSelf);

        return (
            <PersonBlock {...blockProps}>
                <FieldList>
                    <Field label={t("people.detail.account.status")}>
                        <PersonStatusChip person={person} />
                    </Field>
                    <Field label={t("users.table.role")}>
                        {isAdmin ? (
                            <div className="space-y-1.5">
                                <Select
                                    // Controlled, so a refused change or a
                                    // refetch puts the real role back.
                                    value={person.role ?? undefined}
                                    onValueChange={(role) =>
                                        updateRole.mutate({
                                            id: membershipId,
                                            data: {
                                                role: role as MemberResponseDtoRole,
                                            },
                                        })
                                    }
                                    disabled={
                                        updateRole.isPending ||
                                        guards.lastAdminGuard
                                    }
                                >
                                    <SelectTrigger className="h-8 w-[170px]">
                                        <SelectValue
                                            placeholder={t("users.table.role")}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(
                                            MemberResponseDtoRole,
                                        ).map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {t(`users.roles.${role}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {guards.lastAdminGuard && (
                                    <p className="text-faint text-xs">
                                        {t("users.lastAdminHint")}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <StatusChip variant="neutral" dot={false}>
                                {t(
                                    `users.roles.${person.role}` as "users.roles.ADMIN",
                                )}
                            </StatusChip>
                        )}
                    </Field>
                    <Field label={t("people.detail.account.signsInWith")}>
                        {person.accountEmail ?? (
                            <span className="text-faint">—</span>
                        )}
                    </Field>
                    <Field label={t("people.detail.account.memberSince")}>
                        {person.joinedAt ? (
                            <span className="tabular-nums">
                                {formatDay(person.joinedAt)}
                            </span>
                        ) : (
                            <span className="text-faint">—</span>
                        )}
                    </Field>
                </FieldList>

                {hasFooter && (
                    <BlockSection className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {guards.canSuspend && (
                                <Button
                                    variant="tableActionDanger"
                                    size="sm"
                                    onClick={() => setConfirmSuspend(true)}
                                    disabled={changeStatus.isPending}
                                    aria-haspopup="dialog"
                                >
                                    {t("users.suspend.action")}
                                </Button>
                            )}
                            {guards.canRestore && (
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        changeStatus.mutate({
                                            id: membershipId,
                                            data: { status: "ACTIVE" },
                                        })
                                    }
                                    disabled={changeStatus.isPending}
                                >
                                    {t("users.restore.action")}
                                </Button>
                            )}
                            {person.ownerId && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        unlink.mutate({
                                            ownerId: person.ownerId!,
                                        })
                                    }
                                    disabled={unlink.isPending}
                                >
                                    {t("people.unlink.action")}
                                </Button>
                            )}
                        </div>
                        {person.ownerId && (
                            <p className="text-faint text-xs">
                                {t("people.detail.account.unlinkNote")}
                            </p>
                        )}
                        {isAdmin && guards.isSelf && (
                            <p className="text-faint text-xs">
                                {t("people.detail.account.selfNote")}
                            </p>
                        )}
                    </BlockSection>
                )}

                <ConfirmDialog
                    open={confirmSuspend}
                    onOpenChange={setConfirmSuspend}
                    title={t("users.suspend.title")}
                    description={t("users.suspend.description", {
                        name: person.displayName,
                    })}
                    confirmLabel={t("users.suspend.confirm")}
                    confirmingLabel={t("users.suspend.confirming")}
                    cancelLabel={t("users.suspend.cancel")}
                    confirming={changeStatus.isPending}
                    onConfirm={() =>
                        changeStatus.mutate({
                            id: membershipId,
                            data: { status: "SUSPENDED" },
                        })
                    }
                />
            </PersonBlock>
        );
    }

    // Without a membership the row is always an owner: an account-only row is
    // a membership by definition.
    if (!person.ownerId) return null;
    const ownerId = person.ownerId;
    const pending = person.inviteStatus === "pending";
    const firstName = addressName(person);
    const explainer = pending
        ? t("people.detail.account.explainPending", { name: firstName })
        : person.email
          ? t("people.detail.account.explainInvite", { name: firstName })
          : t("people.detail.account.explainNoEmail");

    return (
        <PersonBlock {...blockProps}>
            <FieldList>
                <Field label={t("people.detail.account.status")}>
                    <PersonStatusChip person={person} />
                </Field>
                {pending && person.inviteCreatedAt && (
                    <Field label={t("people.detail.account.sent")}>
                        <span className="tabular-nums">
                            {formatDay(person.inviteCreatedAt)} ·{" "}
                            {formatDistanceToNow(
                                new Date(person.inviteCreatedAt),
                                { addSuffix: true, locale },
                            )}
                        </span>
                    </Field>
                )}
                {pending && person.email && (
                    <Field label={t("people.detail.account.to")}>
                        {person.email}
                    </Field>
                )}
            </FieldList>

            <p className="text-secondary-foreground text-sm">{explainer}</p>

            <div className="flex flex-wrap gap-2">
                {person.email && !pending && (
                    <Button
                        size="sm"
                        onClick={() => sendInvite.mutate({ ownerId })}
                        disabled={sendInvite.isPending}
                    >
                        <SendIcon />
                        {sendInvite.isPending
                            ? t("owners.invite.sending")
                            : t("owners.invite.send")}
                    </Button>
                )}
                {pending && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendInvite.mutate({ ownerId })}
                            disabled={sendInvite.isPending}
                        >
                            {sendInvite.isPending
                                ? t("owners.invite.sending")
                                : t("owners.invite.resend")}
                        </Button>
                        <Button
                            variant="tableActionDanger"
                            size="sm"
                            onClick={() => revokeInvite.mutate({ ownerId })}
                            disabled={revokeInvite.isPending}
                        >
                            {t("owners.invite.revoke")}
                        </Button>
                    </>
                )}
                {!person.email && (
                    <Button size="sm" onClick={onAddEmail}>
                        {t("owners.addEmail.action")}
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinking(true)}
                >
                    <LinkIcon />
                    {t("people.link.action")}
                </Button>
            </div>

            <LinkAccountDialog
                owner={linking ? person : null}
                people={people}
                onOpenChange={(open) => !open && setLinking(false)}
            />
        </PersonBlock>
    );
}
