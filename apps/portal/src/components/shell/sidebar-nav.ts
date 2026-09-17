import {
    Building2,
    FileText,
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
    { labelKey: "common:nav.voting", to: "/voting", icon: Vote },
];

/**
 * The register of who belongs to the building and what they own. Everyone
 * reads it — the pages themselves grow with the role — so the group is not
 * gated the way it was when it held the board's own copy of the same lists.
 */
export const MANAGEMENT_NAV: SidebarNavItem[] = [
    { labelKey: "common:nav.people", to: "/people", icon: Users },
    {
        labelKey: "common:nav.units",
        to: "/units",
        icon: Building2,
        isActive: (p) => p.startsWith("/units"),
    },
];

export const PLANNED_NAV: PlannedNavItem[] = [
    { labelKey: "common:nav.finances", icon: Wallet },
    { labelKey: "common:nav.documents", icon: FileText },
    { labelKey: "common:nav.maintenance", icon: Wrench },
];
