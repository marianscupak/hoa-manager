import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
    toast,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { MemberResponseDto } from "@/api/generated/model";
import { MemberResponseDtoRole } from "@/api/generated/model/memberResponseDtoRole";
import {
    getMemberControllerGetMembersQueryKey,
    useMemberControllerUpdateMemberRole,
} from "@/api/generated/tenant-members/tenant-members";

interface UserRowActionsProps {
    member: MemberResponseDto;
    onSuccess: () => void;
    isLastAdmin: boolean;
}

export function UserRowActions({
    member,
    onSuccess,
    isLastAdmin,
}: UserRowActionsProps) {
    const { t } = useTranslation(["admin"]);
    const queryClient = useQueryClient();

    const updateRole = useMemberControllerUpdateMemberRole({
        mutation: {
            onSuccess: () => {
                toast.success(t("users.updateRole.success"));
                queryClient.invalidateQueries({
                    queryKey: getMemberControllerGetMembersQueryKey(),
                });
                onSuccess();
            },
            onError: showApiError,
        },
    });

    const handleRoleChange = (role: string) => {
        updateRole.mutate({
            id: member.id,
            data: { role: role as MemberResponseDtoRole },
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Select
                defaultValue={member.role}
                onValueChange={handleRoleChange}
                disabled={
                    updateRole.isPending ||
                    (isLastAdmin && member.role === "ADMIN")
                }
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
        </div>
    );
}
