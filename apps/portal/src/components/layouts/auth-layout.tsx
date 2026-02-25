import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "@/providers/auth-provider";

export function AuthLayout() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="animate-pulse text-slate-500">Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to so we can drop them off there after they login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            {/* 
                TODO: Add Global Header here
                <Header /> 
            */}
            <main className="flex-1 p-6">
                <Outlet />
            </main>
        </div>
    );
}
