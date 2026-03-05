import { Outlet } from "react-router";

export function VotingAdminLayout() {
    return (
        <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
                Voting (Admin View)
            </h2>
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
}
