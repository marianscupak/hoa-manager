import { Outlet } from "react-router";

import { SidebarLayout } from "../../../components/layouts/sidebar-layout";

interface VotingAdminLayoutProps {
    navigation: { name: string; href: string }[];
}

export function VotingAdminLayout({ navigation }: VotingAdminLayoutProps) {
    return (
        <SidebarLayout navigation={navigation}>
            <Outlet />
        </SidebarLayout>
    );
}
