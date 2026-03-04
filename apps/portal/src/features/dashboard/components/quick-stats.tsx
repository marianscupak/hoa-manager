import { Building, Mail, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@hoa-mngr/ui";

import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";
import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";

interface StatItemProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | undefined;
    isLoading: boolean;
}

function StatItem({ icon: Icon, label, value, isLoading }: StatItemProps) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div className="bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="text-primary h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">
                        {label}
                    </span>
                    <span className="text-2xl font-bold">
                        {isLoading ? "—" : value ?? 0}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

export function QuickStats() {
    const { t } = useTranslation("home");

    const { data: units, isLoading: unitsLoading } =
        useUnitControllerGetUnits();
    const { data: owners, isLoading: ownersLoading } =
        useOwnerControllerGetOwners();

    const pendingInvites =
        owners?.filter((o) => o.inviteStatus === "pending").length ?? 0;

    const stats = [
        {
            icon: Building,
            label: t("stats.units"),
            value: units?.length,
            isLoading: unitsLoading,
        },
        {
            icon: Users,
            label: t("stats.owners"),
            value: owners?.length,
            isLoading: ownersLoading,
        },
        {
            icon: Mail,
            label: t("stats.pendingInvites"),
            value: pendingInvites,
            isLoading: ownersLoading,
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
                <StatItem key={stat.label} {...stat} />
            ))}
        </div>
    );
}
