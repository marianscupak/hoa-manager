export default {
    greeting: "Welcome back, {{name}}",
    greetingFallback: "Welcome back",
    membership: {
        title: "Membership",
        community: "Community",
        role: "Role",
        status: "Status",
        active: "Active",
        suspended: "Suspended",
        invited: "Invited",
    },
    stats: {
        units: "Units",
        owners: "Owners",
        pendingInvites: "Pending Invites",
    },
    quickLinks: {
        title: "Quick Actions",
        manageUnits: "Manage Units",
        manageOwners: "Manage Owners",
        manageUnitsDesc: "View and manage property units",
        manageOwnersDesc: "View and manage property owners",
    },
    ownerPlaceholder: {
        title: "More Features Coming Soon",
        description:
            "We're working on adding more information and tools for unit owners. Stay tuned!",
    },
} as const;
