import { Building, ChevronRight, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@hoa-mngr/ui";

interface QuickLinkItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    to: string;
}

function QuickLinkRow({ icon: Icon, label, description, to }: QuickLinkItem) {
    return (
        <Link
            to={to}
            className="hover:bg-muted/50 flex items-center gap-4 rounded-lg p-3 transition-colors"
        >
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <Icon className="text-muted-foreground h-5 w-5" />
            </div>
            <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-muted-foreground text-xs">
                    {description}
                </span>
            </div>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
        </Link>
    );
}

export function QuickLinks() {
    const { t } = useTranslation("home");

    const links: QuickLinkItem[] = [
        {
            icon: Building,
            label: t("quickLinks.manageUnits"),
            description: t("quickLinks.manageUnitsDesc"),
            to: "/admin/units",
        },
        {
            icon: Users,
            label: t("quickLinks.manageOwners"),
            description: t("quickLinks.manageOwnersDesc"),
            to: "/admin/owners",
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {t("quickLinks.title")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                {links.map((link) => (
                    <QuickLinkRow key={link.to} {...link} />
                ))}
            </CardContent>
        </Card>
    );
}
