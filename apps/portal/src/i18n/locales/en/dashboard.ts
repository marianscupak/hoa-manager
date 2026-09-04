export const dashboard = {
    pageTitle: "Dashboard",

    featuredVote: {
        closesIn: "Closes {{when}}",
        startsAndCloses: "Starts {{startWhen}}, closes {{closeWhen}}",
        ctaCast: "Cast your ballot",
        ctaOpen: "Open vote",
        personalUncast: "You haven't voted yet",
        personalCast: "You've cast your ballot",
        personalDelegated: "You've delegated your vote",
        emptyTitle: "No votes are currently open or scheduled.",
        errorMessage: "Couldn't load the featured vote.",
        turnoutLine: "{{voted}} of {{total}} units have voted",
    },

    buildingOverview: {
        pendingInvites: {
            label: "Invites pending",
        },
        units: {
            total: "Units",
        },
        owners: {
            active: "Owners",
        },
        buildingShare: {
            title: "Building shares",
        },
        errorMessage: "Couldn't load building overview.",
        sectionTitle: "Building",
        manage: "Manage",
    },

    attention: {
        sectionTitle: "Needs attention",
        shareDrift: "Building shares sum to {{sum}} % — review unit shares",
        unitsWithoutOwner: "{{count}} unit(s) without an assigned owner",
        pendingInvites: "{{count}} pending owner invite(s)",
    },

    comingUp: {
        sectionTitle: "Coming up",
        opens: "Voting opens",
        closes: "Voting closes",
    },

    ownedUnits: {
        sectionTitle: "My units",
        columnUnit: "Unit",
        columnOwnerShare: "Your share",
        columnBuildingShare: "Share of common parts",
        emptyTitle: "No units assigned to you yet",
        errorMessage: "Couldn't load your units.",
        coOwned: "co-owned",
        viewAll: "View all",
    },

    activityFeed: {
        sectionTitle: "Recent activity",
        emptyTitle: "No activity yet",
        errorMessage: "Couldn't load activity.",
    },
} as const;
