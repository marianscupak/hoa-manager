import { useAtomValue } from "jotai";

import { tenantContextAtom } from "@/auth/atoms";

import { VotingAdminLayout } from "./voting-admin-layout";
import { VotingUnitOwnerLayout } from "./voting-unit-owner-layout";

export function VotingLayout() {
    const tenantCtx = useAtomValue(tenantContextAtom);
    const isAdmin =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    if (isAdmin) {
        return <VotingAdminLayout />;
    }

    return <VotingUnitOwnerLayout />;
}
