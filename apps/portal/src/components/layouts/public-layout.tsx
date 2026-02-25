import { Navigate, Outlet } from "react-router";

import { useAuth } from "@/providers/auth-provider";

export function PublicLayout() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
            <div className="w-full max-w-md">
                <Outlet />
            </div>
        </div>
    );
}
