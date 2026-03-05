import { useAtomValue } from "jotai";
import { useLocation } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";

export function useNavigation() {
    const tenantCtx = useAtomValue(tenantContextAtom);
    const location = useLocation();

    const isAdminOrBoardMember =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    const links = [
        {
            name: "Dashboard",
            path: "/",
            active: location.pathname === "/",
        },
        {
            name: "Voting",
            path: "/voting",
            active: location.pathname.startsWith("/voting"),
        },
    ];

    if (isAdminOrBoardMember) {
        links.push({
            name: "Admin",
            path: "/admin",
            active: location.pathname.startsWith("/admin"),
        });
    }

    return { links };
}
