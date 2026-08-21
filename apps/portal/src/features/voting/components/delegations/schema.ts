import { TFunction } from "i18next";
import { z } from "zod";

export const adminRecordDelegationSchema = (t: TFunction<"voting">) =>
    z.object({
        voteId: z.string().min(1, t("delegations.admin.errors.vote")),
        unitId: z.string().min(1, t("delegations.admin.errors.unit")),
        ownerMembershipId: z
            .string()
            .min(1, t("delegations.admin.errors.owner")),
        delegateMembershipId: z
            .string()
            .min(1, t("delegations.admin.errors.delegate")),
    });

export type AdminRecordDelegationFormValues = z.infer<
    ReturnType<typeof adminRecordDelegationSchema>
>;
