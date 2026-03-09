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
            ruleset: {
                title: "Pravidla hlasování",
                description:
                    "Nastavte usnášeníschopnost, volební limity a pravidla vah.",
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
                errors: {
                    required: "Název je vyžadován",
                },
            },
            description: {
                label: "Popis",
                placeholder: "Popište účel tohoto hlasování.",
            },
            scheduledFrom: {
                label: "Začátek hlasování",
                description: "Kdy se má hlasování automaticky otevřít?",
            },
            scheduledTo: {
                label: "Konec hlasování",
                description: "Kdy se má hlasování automaticky uzavřít?",
            },
            weightBasis: {
                label: "Váha hlasů",
                placeholder: "Vyberte váhu hlasů",
                options: {
                    UNIT_SHARE: "Podle podílu",
                    ONE_UNIT_ONE_VOTE: "Jedna jednotka = jeden hlas",
                },
            },
            quorumElectorateBasis: {
                label: "Základ pro výpočet kvóra",
                placeholder: "Vyberte základ",
                options: {
                    ALL_UNITS: "Všechny jednotky",
                    ELIGIBLE_UNITS_ONLY: "Pouze oprávněné jednotky",
                },
            },
            quorumMeasure: {
                label: "Způsob výpočtu kvóra",
                placeholder: "Vyberte způsob výpočtu",
                options: {
                    UNIT_SHARE: "Podle podílu",
                    UNIT_COUNT: "Podle počtu jednotek",
                },
            },
            quorumThreshold: {
                label: "Požadované kvórum",
                placeholder: "Zadejte hodnotu kvóra",
                errors: {
                    positiveNumber: "Musí být kladné číslo",
                },
            },
            majorityRuleType: {
                label: "Typ většiny",
                placeholder: "Vyberte typ většiny",
                options: {
                    SIMPLE_MAJORITY: "Prostá většina",
                    QUALIFIED_MAJORITY: "Kvalifikovaná většina",
                },
            },
            majorityThreshold: {
                label: "Požadovaná většina",
                placeholder: "Zadejte prahovou hodnotu kvalifikované většiny",
                errors: {
                    positiveNumber: "Musí být kladné číslo",
                },
            },
            allowAbstain: {
                label: "Povolit možnost 'Zdržuji se'?",
                description:
                    "Umožní hlasujícím se výslovně zdržet hlasování v otázkách.",
            },
            abstainExcluded: {
                label: "Vyloučit 'Zdržuji se' z většiny?",
                description:
                    "Pokud je zaškrtnuto, hlasy 'Zdržuji se' nebudou započítány do základu pro výpočet většiny.",
            },
            time: "Čas",
        },
        actions: {
            next: "Další krok",
            back: "Zpět",
            submit: "Uložit pravidla a dokončit",
            saved: "Uloženo",
            saveNext: "Uložit a pokračovat",
            finishLater: "Dokončit později",
        },
        toast: {
            success: "Hlasování bylo úspěšně vytvořeno",
            error: "Vytvoření hlasování se nezdařilo",
            rulesetError: "Nepodařilo se nastavit pravidla hlasování",
        },
    },
};
