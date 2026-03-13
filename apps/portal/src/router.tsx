import { createBrowserRouter, Navigate } from "react-router";

import { ErrorBoundary } from "@/components/error/error-boundary";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { InviteLayout } from "@/components/layouts/invite-layout";
import { PublicLayout } from "@/components/layouts/public-layout";
import { SelectTenantLayout } from "@/components/layouts/select-tenant-layout";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { OwnersPage } from "@/features/admin/pages/owners-page";
import { UnitsPage } from "@/features/admin/pages/units-page";
import { GoogleCallbackPage } from "@/features/auth/pages/google-callback-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { SelectTenantPage } from "@/features/auth/pages/select-tenant-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { OwnerInvitePage } from "@/features/invite/pages/owner-invite-page";
import { ProfilePage } from "@/features/profile/pages/profile-page";
import { CreateTenantPage } from "@/features/tenants/pages/create-tenant-page";
import { VotingAdminGuard } from "@/features/voting/guards/voting-admin-guard";
import { VotingLayout } from "@/features/voting/layouts/voting-layout";
import { CreateVotePage } from "@/features/voting/pages/create-vote-page";
import { EditVotePage } from "@/features/voting/pages/edit-vote-page";
import { VoteDetailPage } from "@/features/voting/pages/vote-detail-page";
import { VotingPage } from "@/features/voting/pages/voting-page";
import { NotFoundPage } from "@/pages/not-found";

import { UnitDetailPage } from "./features/admin/pages/unit-detail-page";

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
            {
                path: "profile",
                element: <ProfilePage />,
            },
            {
                path: "voting",
                element: <VotingLayout />,
                children: [
                    {
                        index: true,
                        element: <VotingPage />,
                    },
                    {
                        element: <VotingAdminGuard />,
                        children: [
                            {
                                path: "create",
                                element: <CreateVotePage />,
                            },
                            {
                                path: ":id/edit",
                                element: <EditVotePage />,
                            },
                        ],
                    },
                    {
                        path: ":id",
                        element: <VoteDetailPage />,
                    },
                ],
            },
            {
                path: "admin",
                element: <AdminLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to="units" replace />,
                    },
                    {
                        path: "units",
                        element: <UnitsPage />,
                    },
                    {
                        path: "owners",
                        element: <OwnersPage />,
                    },
                    {
                        path: "units/:id",
                        element: <UnitDetailPage />,
                    },
                ],
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
        ],
    },
    {
        path: "/auth/google/callback",
        element: (
            <ErrorBoundary>
                <GoogleCallbackPage />
            </ErrorBoundary>
        ),
    },
    {
        path: "/invites",
        element: (
            <ErrorBoundary>
                <InviteLayout />
            </ErrorBoundary>
        ),
        children: [
            {
                path: "owner",
                element: <OwnerInvitePage />,
            },
        ],
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);
