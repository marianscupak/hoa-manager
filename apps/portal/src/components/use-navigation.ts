import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";

interface NavLink {
    name: string;
    path: string;
    active: boolean;
}

export function useNavigation() {
    const { t } = useTranslation(["common"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const location = useLocation();

    const isAdminOrBoardMember =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    const links: NavLink[] = [
        {
            name: t("common:nav.dashboard"),
            path: "/",
            active: location.pathname === "/",
        },
        {
            name: t("common:nav.voting"),
            path: "/voting",
            active: location.pathname.startsWith("/voting"),
        },
    ];

    if (isAdminOrBoardMember) {
        links.push({
            name: t("common:nav.admin"),
            path: "/admin",
            active: location.pathname.startsWith("/admin"),
        });
    }

    return { links };
}
