export const voting = {
    navigation: {
        activeVotes: "Aktivní hlasování",
        results: "Výsledky",
        createVote: "Vytvořit hlasování",
    },
    create: {
        title: "Vytvořit hlasování",
        description: "Nastavte nové hlasování pro společenství.",
        steps: {
            basicInfo: {
                title: "Základní informace",
                description: "Zadejte hlavní údaje pro toto hlasování.",
            },
            rules: {
                title: "Pravidla",
                description:
                    "Definujte váhu hlasování, kvórum a pravidla pro většinu.",
            },
            questions: {
                title: "Otázky",
                description: "Přidejte otázky a možnosti pro toto hlasování.",
            },
        },
        fields: {
            title: {
                label: "Název",
                placeholder: "např. Schválení opravy střechy",
            },
            description: {
                label: "Popis",
                placeholder: "např. Popište účel tohoto hlasování.",
            },
            scheduledFrom: {
                label: "Začátek hlasování",
                description: "Kdy se má hlasování automaticky otevřít?",
            },
            scheduledTo: {
                label: "Konec hlasování",
                description: "Kdy se má hlasování automaticky uzavřít?",
            },
        },
        actions: {
            next: "Další krok",
            back: "Zpět",
            submit: "Vytvořit hlasování",
        },
        toast: {
            success: "Hlasování bylo úspěšně vytvořeno",
            error: "Vytvoření hlasování se nezdařilo",
        },
    },
};
