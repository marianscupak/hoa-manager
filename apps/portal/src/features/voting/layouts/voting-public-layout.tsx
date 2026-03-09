import { Outlet } from "react-router";

import { SidebarLayout } from "../../../components/layouts/sidebar-layout";

interface VotingPublicLayoutProps {
    navigation: { name: string; href: string }[];
}

export function VotingPublicLayout({ navigation }: VotingPublicLayoutProps) {
    return (
        <SidebarLayout navigation={navigation}>
            <Outlet />
        </SidebarLayout>
    );
}
