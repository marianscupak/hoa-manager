import {
    Building2,
    FileText,
    House,
    LayoutDashboard,
    type LucideIcon,
    Users,
    Vote,
    Wallet,
    Wrench,
} from "lucide-react";

export interface SidebarNavItem {
    labelKey: string;
    to: string;
    icon: LucideIcon;
    end?: boolean;
    isActive?: (pathname: string) => boolean;
}

export interface PlannedNavItem {
    labelKey: string;
    icon: LucideIcon;
}

export const MAIN_NAV: SidebarNavItem[] = [
    {
        labelKey: "common:nav.dashboard",
        to: "/",
        icon: LayoutDashboard,
        end: true,
    },
    {
        labelKey: "common:nav.myUnits",
        to: "/units",
        icon: House,
        isActive: (p) => p.startsWith("/units"),
    },
    { labelKey: "common:nav.voting", to: "/voting", icon: Vote },
    { labelKey: "common:nav.people", to: "/people", icon: Users },
];

export const ADMIN_NAV: SidebarNavItem[] = [
    {
        labelKey: "common:nav.units",
        to: "/admin/units",
        icon: Building2,
        isActive: (p) => p.startsWith("/admin/units"),
    },
];

export const PLANNED_NAV: PlannedNavItem[] = [
    { labelKey: "common:nav.finances", icon: Wallet },
    { labelKey: "common:nav.documents", icon: FileText },
    { labelKey: "common:nav.maintenance", icon: Wrench },
];
