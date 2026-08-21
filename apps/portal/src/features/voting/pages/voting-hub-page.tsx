import { useAtomValue } from "jotai";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router";

import { Button } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";

import { VotingActiveTab } from "../components/hub/voting-active-tab";
import { VotingDelegationsTab } from "../components/hub/voting-delegations-tab";
import { VotingResultsTab } from "../components/hub/voting-results-tab";

const TABS = [
    {
        key: "active",
        to: "/voting",
        end: true,
        labelKey: "voting:hub.tabs.active",
    },
    {
        key: "results",
        to: "/voting/results",
        labelKey: "voting:hub.tabs.results",
    },
    {
        key: "delegations",
        to: "/voting/delegations",
        labelKey: "voting:hub.tabs.delegations",
    },
] as const;

export function VotingHubPage({
    tab,
}: {
    tab: "active" | "results" | "delegations";
}) {
    const { t } = useTranslation(["voting"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const adminOrBoard = isAdminOrBoard(tenantCtx?.roles);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="font-display text-3xl font-black tracking-tight">
                    {t("voting:hub.title")}
                </h1>
                {adminOrBoard && (
                    <Button asChild>
                        <Link to="/voting/create">
                            <Plus /> {t("voting:hub.newVote")}
                        </Link>
                    </Button>
                )}
            </div>

            <nav
                className="border-border flex gap-6 border-b"
                aria-label={t("voting:hub.title")}
            >
                {TABS.map((tabDef) => (
                    <NavLink
                        key={tabDef.key}
                        to={tabDef.to}
                        end={"end" in tabDef ? tabDef.end : undefined}
                        className={({ isActive }) =>
                            cn(
                                "focus-visible:ring-ring -mb-px border-b-2 px-1 pb-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                                isActive
                                    ? "border-primary text-foreground font-semibold"
                                    : "text-muted-foreground hover:text-foreground border-transparent font-medium",
                            )
                        }
                    >
                        {t(tabDef.labelKey)}
                    </NavLink>
                ))}
            </nav>

            {tab === "active" && <VotingActiveTab />}
            {tab === "results" && <VotingResultsTab />}
            {tab === "delegations" && <VotingDelegationsTab />}
        </div>
    );
}
