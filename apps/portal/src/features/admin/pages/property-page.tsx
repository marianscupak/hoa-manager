import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

import { Button } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";
import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";

import { OwnersPage } from "./owners-page";
import { UnitsPage } from "./units-page";

export function PropertyPage({ tab }: { tab: "units" | "owners" }) {
    const { t } = useTranslation(["admin"]);
    const [unitsCreateOpen, setUnitsCreateOpen] = useState(false);
    const [ownersCreateOpen, setOwnersCreateOpen] = useState(false);

    // Fetched here (in addition to the tab pages themselves) purely for the
    // tab-label counts; react-query dedupes these with the tab pages' fetches
    // since they share the same query keys.
    const { data: units } = useUnitControllerGetUnits();
    const { data: owners } = useOwnerControllerGetOwners();

    // Reset the inactive tab's create-dialog state so it can't stale-reopen
    // when navigating back to that tab (e.g. via browser back/forward).
    useEffect(() => {
        if (tab !== "units") setUnitsCreateOpen(false);
        if (tab !== "owners") setOwnersCreateOpen(false);
    }, [tab]);

    const tabs = [
        {
            key: "units" as const,
            to: "/admin/units",
            labelKey: "admin:property.tabs.units" as const,
            count: units?.length ?? 0,
        },
        {
            key: "owners" as const,
            to: "/admin/owners",
            labelKey: "admin:property.tabs.owners" as const,
            count: owners?.length ?? 0,
        },
    ];

    const addButton =
        tab === "units"
            ? {
                  label: t("admin:property.addUnit"),
                  onClick: () => setUnitsCreateOpen(true),
              }
            : {
                  label: t("admin:property.addOwner"),
                  onClick: () => setOwnersCreateOpen(true),
              };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="font-display text-3xl font-black tracking-tight">
                    {t("admin:property.title")}
                </h1>
                <Button onClick={addButton.onClick}>
                    <Plus /> {addButton.label}
                </Button>
            </div>

            <nav
                className="border-border flex gap-6 border-b"
                aria-label={t("admin:property.title")}
            >
                {tabs.map((tabDef) => (
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
                        {t(tabDef.labelKey)} ({tabDef.count})
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
