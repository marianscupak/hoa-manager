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
                defaultTitle: "Nová otázka",
                addQuestion: "Přidat otázku",
                emptyState:
                    "Zatím nebyly přidány žádné otázky. Přidejte první otázku kliknutím na tlačítko výše.",
                loadError: "Nepodařilo se načíst detaily hlasování.",
                createSuccess: "Otázka byla úspěšně přidána",
                deleteConfirm: "Opravdu chcete smazat tuto otázku?",
                deleteSuccess: "Otázka byla smazána",
                updateSuccess: "Otázka byla aktualizována",
                saving: "Ukládání změn...",
                autoSave: "Změny jsou ukládány automaticky",
                fields: {
                    title: {
                        label: "Znění otázky",
                        placeholder: "Zadejte text otázky...",
                    },
                    description: {
                        label: "Doplňující popis",
                        placeholder: "Nepovinný doplňující text k otázce...",
                    },
                    type: {
                        label: "Typ odpovědi",
                        options: {
                            YES_NO: "Ano / Ne",
                            SINGLE_CHOICE: "Výběr z možností",
                        },
                    },
                },
                options: {
                    title: "Možnosti",
                    addOption: "Přidat možnost",
                    placeholder: "Text možnosti...",
                    defaultLabel: "Možnost",
                    abstain: "Zdržel se (automaticky doplněno)",
                },
            },
        },
        optionLabels: {
            YES: "Pro",
            NO: "Proti",
            ABSTAIN: "Zdržel se",
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
            finish: "Ukončit",
        },
        toast: {
            success: "Hlasování bylo úspěšně vytvořeno",
            error: "Vytvoření hlasování se nezdařilo",
            rulesetError: "Nepodařilo se nastavit pravidla hlasování",
            rulesetSuccess: "Pravidla byla úspěšně nastavena",
        },
    },
    list: {
        title: "Aktivní a naplánovaná hlasování",
        description:
            "Přehled všech nadcházejících hlasování, která vyžadují vaši pozornost nebo brzy začnou.",
        error: "Nepodařilo se načíst hlasování.",
        filters: {
            all: "Vše",
            open: "Otevřená",
            scheduled: "Naplánovaná",
            closed: "Ukončená",
        },
        empty: {
            all: "Nebyla nalezena žádná hlasování.",
            filtered: "Nebyla nalezena žádná {{status}} hlasování.",
        },
        status: {
            OPEN: "Otevřené",
            SCHEDULED: "Naplánované",
            CLOSED: "Ukončené",
        },
        card: {
            endsOn: "Končí ",
            startsOn: "Začíná ",
            noDescription: "Nebyl poskytnut žádný popis.",
            canVote: "Můžete hlasovat",
            voteRequired: "Váš hlas je vyžadován.",
            voteAction: "Hlasovat",
            delegationNeeded: "Je potřeba delegace",
            fromCoOwners: "Od spoluvlastníků",
            manageDelegation: "Spravovat delegaci",
            completed: "Hlasování dokončeno",
            viewOutcomes: "Zobrazit konečné výsledky",
            viewResults: "Zobrazit výsledky",
        },
    },
    detail: {
        timeline: {
            startDate: "DATUM ZAHÁJENÍ",
            endDate: "DATUM UKONČENÍ",
        },
        description: {
            title: "Popis",
        },
        documents: {
            title: "Dokumenty",
            uploaded: "Nahráno",
        },
        questions: {
            title: "Položky k hlasování",
            preview: "Náhled otázek, o kterých budete hlasovat",
            majorityPrefix: "Vyžaduje",
            majoritySuffix: "většinu všech podílů.",
        },
        statusSidebar: {
            title: "Váš status hlasování",
            closesIn: "Hlasování končí za",
            owningUnits: "VLASTNĚNÉ JEDNOTKY",
            share: "Podíl:",
            statusReady: "Připraveno",
            statusDelegation: "Vyžaduje delegaci",
            delegationWarning: "{{unitName}} je ve spoluvlastnictví. Pro hlasování za tuto jednotku je vyžadován formulář delegace.",
            manageDelegation: "Spravovat delegaci",
            totalPower: "Celková síla hlasu:",
            voteButton: "Hlasovat",
            secureBoothHint: "Kliknutím na „Hlasovat“ vstoupíte do zabezpečené hlasovací místnosti.",
        },
    },
};
