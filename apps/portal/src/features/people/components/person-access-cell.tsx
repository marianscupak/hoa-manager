import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    StatusChip,
    type StatusChipVariant,
    toast,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { MemberResponseDtoRole } from "@/api/generated/model/memberResponseDtoRole";
import { getPeopleControllerGetPeopleQueryKey } from "@/api/generated/people/people";
import { useMemberControllerUpdateMemberRole } from "@/api/generated/tenant-members/tenant-members";

import { type PersonRow } from "../utils/people-filter";

const STATUS_VARIANT: Record<string, StatusChipVariant> = {
    ACTIVE: "success",
    INVITED: "warning",
};

interface PersonAccessCellProps {
    person: PersonRow;
    /** Changing a role is ADMIN-only, as the endpoint already enforces. */
    isAdmin: boolean;
    /** True when this association has exactly one ADMIN left. */
    isLastAdmin: boolean;
}

/**
 * What access this person has, and — for an admin — the control that changes
 * it. The two belong together: a role is not an action you take on a row, it
 * is the row's state.
 */
export function PersonAccessCell({
    person,
    isAdmin,
    isLastAdmin,
}: PersonAccessCellProps) {
    const { t } = useTranslation(["admin"]);
    const queryClient = useQueryClient();

    const updateRole = useMemberControllerUpdateMemberRole({
        mutation: {
            onSuccess: () => {
                toast.success(t("users.updateRole.success"));
                void queryClient.invalidateQueries({
                    queryKey: getPeopleControllerGetPeopleQueryKey(),
                });
            },
            onError: showApiError,
        },
    });

    if (!person.membershipId || !person.role) {
        if (person.inviteStatus) {
            return (
                <StatusChip variant="warning">
                    {t("people.access.invited")}
                </StatusChip>
            );
        }
        return (
            <span className="text-faint text-sm">
                {t("people.access.noAccount")}
            </span>
        );
    }

    const status = person.status;
    const statusChip = status && status !== "ACTIVE" && (
        <StatusChip variant={STATUS_VARIANT[status] ?? "warning"}>
            {t(`users.table.status.${status}` as "users.table.status.ACTIVE")}
        </StatusChip>
    );

    if (!isAdmin) {
        return (
            <div className="flex flex-wrap items-center gap-1.5">
                <StatusChip variant="neutral" dot={false}>
                    {t(`users.roles.${person.role}` as "users.roles.ADMIN")}
                </StatusChip>
                {statusChip}
            </div>
        );
    }

    const membershipId = person.membershipId;
    const lastAdminGuard = isLastAdmin && person.role === "ADMIN";

    const select = (
        <Select
            defaultValue={person.role}
            onValueChange={(role) =>
                updateRole.mutate({
                    id: membershipId,
                    data: { role: role as MemberResponseDtoRole },
                })
            }
            disabled={updateRole.isPending || lastAdminGuard}
        >
            <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder={t("users.table.role")} />
            </SelectTrigger>
            <SelectContent>
                {Object.values(MemberResponseDtoRole).map((role) => (
                    <SelectItem key={role} value={role}>
                        {t(`users.roles.${role}`)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {lastAdminGuard ? (
                <TooltipProvider>
                    <Tooltip>
                        {/* Radix needs a hoverable trigger; a disabled control
                            fires no pointer events, so wrap it in a span. */}
                        <TooltipTrigger asChild>
                            <span className="inline-flex">{select}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t("users.lastAdminHint")}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                select
            )}
            {statusChip}
        </div>
    );
}
