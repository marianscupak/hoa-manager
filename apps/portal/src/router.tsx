import { createBrowserRouter, Navigate } from "react-router";

import { ErrorBoundary } from "@/components/error/error-boundary";
import { InviteLayout } from "@/components/layouts/invite-layout";
import { PublicLayout } from "@/components/layouts/public-layout";
import { SelectTenantLayout } from "@/components/layouts/select-tenant-layout";
import { AdminGuard } from "@/components/shell/admin-guard";
import { AppShell } from "@/components/shell/app-shell";
import { AuthGuard } from "@/components/shell/auth-guard";
import { KatastrImportPage } from "@/features/admin/pages/katastr-import-page";
import { GoogleCallbackPage } from "@/features/auth/pages/google-callback-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { SelectTenantPage } from "@/features/auth/pages/select-tenant-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { OwnerInvitePage } from "@/features/invite/pages/owner-invite-page";
import { PeoplePage } from "@/features/people/pages/people-page";
import { ProfilePage } from "@/features/profile/pages/profile-page";
import { CreateTenantPage } from "@/features/tenants/pages/create-tenant-page";
import { UnitDetailRoute } from "@/features/units/pages/unit-detail-route";
import { UnitsPage } from "@/features/units/pages/units-page";
import { VotingAdminGuard } from "@/features/voting/guards/voting-admin-guard";
import { AssemblyRecordPage } from "@/features/voting/pages/assembly-record-page";
import { AssemblyRecordReviewPage } from "@/features/voting/pages/assembly-record-review-page";
import { CastVotePage } from "@/features/voting/pages/cast-vote-page";
import { CreateVotePage } from "@/features/voting/pages/create-vote-page";
import { DelegateVotePage } from "@/features/voting/pages/delegate-vote-page";
import { EditVotePage } from "@/features/voting/pages/edit-vote-page";
import { LiveResultsPage } from "@/features/voting/pages/live-results-page";
import { RecordPaperBallotPage } from "@/features/voting/pages/record-paper-ballot-page";
import { VoteDetailPage } from "@/features/voting/pages/vote-detail-page";
import { VoteResultsPage } from "@/features/voting/pages/vote-results-page";
import { VotingHubPage } from "@/features/voting/pages/voting-hub-page";
import { NotFoundPage } from "@/pages/not-found";

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <ErrorBoundary>
                <AuthGuard />
            </ErrorBoundary>
        ),
        children: [
            {
                element: <AppShell />,
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
                        // One register for the whole association. The list
                        // and the detail grow with the reader's role rather
                        // than living at a second address for the board.
                        path: "units",
                        children: [
                            {
                                index: true,
                                element: <UnitsPage />,
                            },
                            {
                                // A bulk write that is hard to unwind, so it
                                // keeps the guard the rest of the module no
                                // longer needs.
                                path: "import",
                                element: <AdminGuard />,
                                children: [
                                    {
                                        index: true,
                                        element: <KatastrImportPage />,
                                    },
                                ],
                            },
                            {
                                path: ":id",
                                element: <UnitDetailRoute />,
                            },
                        ],
                    },
                    {
                        path: "voting",
                        children: [
                            {
                                index: true,
                                element: <VotingHubPage tab="active" />,
                            },
                            {
                                path: "results",
                                element: <VotingHubPage tab="results" />,
                            },
                            {
                                path: "delegations",
                                element: <VotingHubPage tab="delegations" />,
                            },
                            {
                                path: ":id",
                                element: <VoteDetailPage />,
                            },
                            {
                                path: ":id/results",
                                element: <VoteResultsPage />,
                            },
                            {
                                path: ":id/delegate",
                                element: <DelegateVotePage />,
                            },
                            {
                                path: ":id/cast",
                                element: <CastVotePage />,
                            },
                            {
                                path: ":id/live-results",
                                element: <LiveResultsPage />,
                            },
                        ],
                    },
                    {
                        path: "people",
                        element: <PeoplePage />,
                    },
                    {
                        path: "admin",
                        element: <AdminGuard />,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/people" replace />,
                            },
                            // The owner register and the member list became
                            // one module; the old paths may be bookmarked.
                            {
                                path: "owners",
                                element: <Navigate to="/people" replace />,
                            },
                            {
                                path: "users",
                                element: <Navigate to="/people" replace />,
                            },
                        ],
                    },
                ],
            },
            {
                // Focus mode — the vote wizard renders without the app shell.
                element: <VotingAdminGuard />,
                children: [
                    {
                        path: "voting/create",
                        element: <CreateVotePage />,
                    },
                    {
                        path: "voting/:id/edit",
                        element: <EditVotePage />,
                    },
                    {
                        path: "voting/:id/paper-ballot",
                        element: <RecordPaperBallotPage />,
                    },
                    {
                        path: "voting/:id/assembly-record",
                        element: <AssemblyRecordPage />,
                    },
                    {
                        path: "voting/:id/assembly-record/review",
                        element: <AssemblyRecordReviewPage />,
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
