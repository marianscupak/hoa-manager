import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

import { Button } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { OwnersPage } from "./owners-page";
import { UnitsPage } from "./units-page";

const TABS = [
    { key: "units", to: "/admin/units", labelKey: "admin:property.tabs.units" },
    {
        key: "owners",
        to: "/admin/owners",
        labelKey: "admin:property.tabs.owners",
    },
] as const;

export function PropertyPage({ tab }: { tab: "units" | "owners" }) {
    const { t } = useTranslation(["admin"]);
    const [unitsCreateOpen, setUnitsCreateOpen] = useState(false);
    const [ownersCreateOpen, setOwnersCreateOpen] = useState(false);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="font-display text-3xl font-black tracking-tight">
                    {t("admin:property.title")}
                </h1>
                {tab === "units" ? (
                    <Button onClick={() => setUnitsCreateOpen(true)}>
                        <Plus /> {t("admin:property.addUnit")}
                    </Button>
                ) : (
                    <Button onClick={() => setOwnersCreateOpen(true)}>
                        <Plus /> {t("admin:property.addOwner")}
                    </Button>
                )}
            </div>

            <nav
                className="border-border flex gap-6 border-b"
                aria-label={t("admin:property.title")}
            >
                {TABS.map((tabDef) => (
                    <NavLink
                        key={tabDef.key}
                        to={tabDef.to}
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

            {tab === "units" ? (
                <UnitsPage
                    createOpen={unitsCreateOpen}
                    onCreateOpenChange={setUnitsCreateOpen}
                />
            ) : (
                <OwnersPage
                    createOpen={ownersCreateOpen}
                    onCreateOpenChange={setOwnersCreateOpen}
                />
            )}
        </div>
    );
}
