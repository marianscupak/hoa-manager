export default {
    owners: {
        title: "Vlastníci",
        description: "Správa vlastníků nemovitostí ve vašem společenství.",
        addOwner: "Přidat vlastníka",
        empty: "Nenalezeni žádní vlastníci.",
        table: {
            displayName: "Zobrazované jméno",
            userAccount: "Uživatelský účet",
            linked: "Propojeno",
            unlinked: "Nepropojeno",
        },
        create: {
            title: "Přidat vlastníka",
            description:
                "Vytvořte nový profil vlastníka nemovitosti. Tímto vlastníkem se následně může propojit uživatelský účet.",
            displayNameLabel: "Zobrazované jméno",
            displayNamePlaceholder: "Např. Jan Novák nebo ACME s.r.o.",
            submit: "Vytvořit vlastníka",
            submitting: "Vytváření...",
            success: "Vlastník byl úspěšně vytvořen",
            error: "Nepodařilo se vytvořit vlastníka",
            required: "Zobrazované jméno je povinné",
        },
    },
    units: {
        title: "Jednotky",
        description: "Správa jednotek ve vašem společenství.",
        addUnit: "Přidat jednotku",
        empty: "Zatím nebyly přidány žádné jednotky.",
        table: {
            unitNumber: "Číslo jednotky",
            buildingShare: "Podíl na budově",
        },
        create: {
            title: "Přidat jednotku",
            description:
                "Vytvořte novou jednotku a přiřaďte jí podíl na budově (hlasovací váhu).",
            unitNoLabel: "Číslo / Označení jednotky",
            unitNoPlaceholder: "Např. A-101 nebo Garáž 1",
            buildingShareLabel: "Podíl na budově",
            buildingSharePlaceholder: "Např. 0.05 (pro 5%)",
            submit: "Vytvořit jednotku",
            submitting: "Vytváření...",
            success: "Jednotka byla úspěšně vytvořena",
            error: "Nepodařilo se vytvořit jednotku",
            unitNoRequired: "Číslo jednotky je povinné",
            buildingShareRequired: "Musí být platné desetinné číslo",
        },
    },
} as const;
