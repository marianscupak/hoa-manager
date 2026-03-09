import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { tenantContextAtom } from "@/auth/atoms";

import { VotingAdminLayout } from "./voting-admin-layout";
import { VotingPublicLayout } from "./voting-public-layout";

export function VotingLayout() {
    const { t } = useTranslation(["voting"]);
    const tenantCtx = useAtomValue(tenantContextAtom);

    const isAdmin =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    const baseNavigation = [
        {
            name: t("voting:navigation.activeVotes"),
            href: "/voting",
        },
        {
            name: t("voting:navigation.results"),
            href: "/voting/results",
        },
    ];

    if (isAdmin) {
        return (
            <VotingAdminLayout
                navigation={[
                    {
                        name: t("voting:navigation.createVote", "Create Vote"),
                        href: "/voting/create",
                    },
                    ...baseNavigation,
                ]}
            />
        );
    }

    return <VotingPublicLayout navigation={baseNavigation} />;
}
