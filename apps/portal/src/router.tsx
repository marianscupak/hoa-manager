import { createBrowserRouter } from "react-router";

import { ErrorBoundary } from "@/components/error/error-boundary";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { PublicLayout } from "@/components/layouts/public-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
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
        ],
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);
