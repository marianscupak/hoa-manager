export const dashboard = {
    pageTitle: "Přehled",

    featuredVote: {
        open: "Probíhá",
        scheduled: "Naplánováno",
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
            none: "Žádné pozvánky čekající na přijetí",
            countOne: "1 čekající pozvánka",
            countOther: "Čekajících pozvánek: {{count}}",
            oldest: "Nejstarší odeslána před {{when}}",
            action: "Spravovat pozvánky",
            label: "Čekající pozvánky",
        },
        units: {
            total: "Jednotky",
            withoutOwnersOne: "1 bez vlastníka",
            withoutOwnersOther: "{{count}} bez vlastníka",
            allAssigned: "Všechny jednotky mají vlastníka",
            action: "Přiřadit vlastníky",
        },
        owners: {
            active: "Vlastníci",
        },
        buildingShare: {
            title: "Podíly v domě",
            ok: "Podíly v součtu dávají 100 %",
            off: "Odchylka {{drift}} %",
            action: "Zkontrolovat jednotky",
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
        sectionTitle: "Vaše jednotky",
        columnUnit: "Jednotka",
        columnOwnerShare: "Váš podíl",
        columnBuildingShare: "Podíl v domě",
        emptyTitle: "Zatím vám nejsou přiřazeny žádné jednotky",
        errorMessage: "Nepodařilo se načíst vaše jednotky.",
        coOwned: "spoluvlastnictví",
    },

    activityFeed: {
        sectionTitle: "Nedávná aktivita",
        emptyTitle: "Zatím žádná aktivita",
        errorMessage: "Nepodařilo se načíst aktivitu.",
    },
} as const;
