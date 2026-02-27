import { createBrowserRouter } from "react-router";

import { ErrorBoundary } from "@/components/error/error-boundary";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { PublicLayout } from "@/components/layouts/public-layout";
import { SelectTenantLayout } from "@/components/layouts/select-tenant-layout";
import { GoogleCallbackPage } from "@/features/auth/pages/google-callback-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { SelectTenantPage } from "@/features/auth/pages/select-tenant-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { CreateTenantPage } from "@/features/tenants/pages/create-tenant-page";
import { NotFoundPage } from "@/pages/not-found";

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <ErrorBoundary>
                <AuthLayout />
            </ErrorBoundary>
        ),
        children: [
            {
                index: true,
                element: <DashboardPage />,
            },
        ],
    },
    {
        path: "/tenant",
        element: (
            <ErrorBoundary>
                <SelectTenantLayout />
            </ErrorBoundary>
        ),
        children: [
            {
                index: true,
                element: <SelectTenantPage />,
            },
            {
                path: "new",
                element: <CreateTenantPage />,
            },
        ],
    },
    {
        path: "/",
        element: (
            <ErrorBoundary>
                <PublicLayout />
            </ErrorBoundary>
        ),
        children: [
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                path: "auth/google/callback",
                element: <GoogleCallbackPage />,
            },
        ],
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);
