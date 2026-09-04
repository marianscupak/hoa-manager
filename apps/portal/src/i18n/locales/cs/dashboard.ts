export const dashboard = {
    pageTitle: "Přehled",

    featuredVote: {
        closesIn: "Končí {{when}}",
        startsAndCloses: "Začíná {{startWhen}}, končí {{closeWhen}}",
        ctaCast: "Hlasovat",
        ctaOpen: "Otevřít hlasování",
        personalUncast: "Ještě jste nehlasovali",
        personalCast: "Hlasovali jste",
        personalDelegated: "Delegovali jste svůj hlas",
        emptyTitle: "Žádná hlasování nejsou aktuálně otevřená ani naplánovaná.",
        errorMessage: "Nepodařilo se načíst hlasování.",
        turnoutLine: "Hlasovalo {{voted}} z {{total}} jednotek",
    },

    buildingOverview: {
        pendingInvites: {
            label: "Čekající pozvánky",
        },
        units: {
            total: "Jednotky",
        },
        owners: {
            active: "Vlastníci",
        },
        buildingShare: {
            title: "Podíly v domě",
        },
        errorMessage: "Nepodařilo se načíst přehled.",
        sectionTitle: "Budova",
        manage: "Spravovat",
    },

    attention: {
        sectionTitle: "Vyžaduje pozornost",
        shareDrift: "Součet podílů je {{sum}} % — zkontrolujte podíly jednotek",
        unitsWithoutOwner: "Jednotky bez vlastníka: {{count}}",
        pendingInvites: "Čekající pozvánky vlastníků: {{count}}",
    },

    comingUp: {
        sectionTitle: "Nadcházející",
        opens: "Začátek hlasování",
        closes: "Konec hlasování",
    },

    ownedUnits: {
        sectionTitle: "Moje jednotky",
        columnUnit: "Jednotka",
        columnOwnerShare: "Váš podíl",
        columnBuildingShare: "Podíl na společných částech",
        emptyTitle: "Zatím vám nejsou přiřazeny žádné jednotky",
        errorMessage: "Nepodařilo se načíst vaše jednotky.",
        coOwned: "spoluvlastnictví",
        viewAll: "Zobrazit vše",
    },

    activityFeed: {
        sectionTitle: "Nedávná aktivita",
        emptyTitle: "Zatím žádná aktivita",
        errorMessage: "Nepodařilo se načíst aktivitu.",
    },
} as const;
