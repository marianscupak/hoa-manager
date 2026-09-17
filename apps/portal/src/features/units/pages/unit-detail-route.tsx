import { useAtomValue } from "jotai";

import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";
import { UnitDetailPage } from "@/features/admin/pages/unit-detail-page";

import { MyUnitDetailPage } from "./my-unit-detail-page";

/**
 * One address for a unit, two depths of detail.
 *
 * Unlike the register list, the two details differ in substance rather than
 * in a column or two — ownership history, scheduled transfers and the editing
 * that goes with them against a plain read — so the route picks a page rather
 * than growing one. The server is what enforces the difference; this only
 * decides what to render.
 */
export function UnitDetailRoute() {
    const tenantCtx = useAtomValue(tenantContextAtom);
    return isAdminOrBoard(tenantCtx?.roles) ? (
        <UnitDetailPage />
    ) : (
        <MyUnitDetailPage />
    );
}
