export const dashboard = {
    pageTitle: "Dashboard",

    featuredVote: {
        open: "Open",
        scheduled: "Scheduled",
        closesIn: "Closes {{when}}",
        startsAndCloses: "Starts {{startWhen}}, closes {{closeWhen}}",
        ctaCast: "Cast your ballot",
        ctaOpen: "Open vote",
        personalUncast: "You haven't voted yet",
        personalCast: "You've cast your ballot",
        personalDelegated: "You've delegated your vote",
        emptyTitle: "No votes are currently open or scheduled.",
        errorMessage: "Couldn't load the featured vote.",
    },

    buildingOverview: {
        pendingInvites: {
            none: "No pending invites",
            countOne: "1 pending invite",
            countOther: "{{count}} pending invites",
            oldest: "Oldest sent {{when}} ago",
            action: "Review invites",
        },
        units: {
            total: "Units",
            withoutOwnersOne: "1 without owner",
            withoutOwnersOther: "{{count}} without owner",
            allAssigned: "All units have owners",
            action: "Assign owners",
        },
        owners: {
            active: "Owners",
        },
        buildingShare: {
            title: "Building shares",
            ok: "Shares add up to 100%",
            off: "Off by {{drift}}%",
            action: "Review units",
        },
        errorMessage: "Couldn't load building overview.",
    },

    ownedUnits: {
        sectionTitle: "Your units",
        columnUnit: "Unit",
        columnOwnerShare: "Your share",
        columnBuildingShare: "Share of building",
        emptyTitle: "No units assigned to you yet",
        errorMessage: "Couldn't load your units.",
    },

    activityFeed: {
        sectionTitle: "Recent activity",
        emptyTitle: "No activity yet",
        errorMessage: "Couldn't load activity.",
    },
} as const;
