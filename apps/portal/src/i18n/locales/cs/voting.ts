export const voting = {
    navigation: {
        activeVotes: "Probíhající hlasování",
        results: "Výsledky",
        createVote: "Vytvořit hlasování",
    },
    common: {
        save: "Uložit",
        cancel: "Zrušit",
    },
    create: {
        title: "Vytvořit hlasování",
        titleEdit: "Upravit hlasování",
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
                defaultDescription:
                    "Tato pravidla se použijí jako výchozí pro všechny otázky. U jednotlivých otázek je můžete později přepsat.",
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
                autoSave: "Všechny změny jsou automaticky ukládány",
                editQuestion: "Upravit otázku",
                actions: {
                    edit: "Upravit",
                },
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
                override: {
                    toggleActive: "Skrýt vlastní pravidla",
                    toggleInactive: "Přizpůsobit pravidla pro tuto otázku",
                    description:
                        "Tato nastavení přepíší výchozí pravidla hlasování pouze pro tuto otázku. Ostatní otázky budou nadále používat výchozí pravidla.",
                    apply: "Použít vlastní pravidla",
                    update: "Aktualizovat pravidla",
                    remove: "Odstranit vlastní pravidla",
                    badge: "Vlastní pravidla",
                    defaultHint:
                        "Tato otázka používá výchozí pravidla hlasování. Klikněte pro přizpůsobení.",
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
            shortVotingPeriodWarning:
                "Doba hlasování je kratší než 15 dní. Zvažte její prodloužení, aby měli všichni vlastníci dostatek času hlasovat.",
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
                label: "Požadované kvórum (%)",
                placeholder: "např. 50",
                errors: {
                    positiveNumber: "Musí být kladné číslo",
                    max: "Nesmí být více než 100 %",
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
                label: "Požadovaná většina (%)",
                placeholder: "např. 66",
                errors: {
                    positiveNumber: "Musí být kladné číslo",
                    max: "Nesmí být více než 100 %",
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
            allowCoOwnerIndividualVote: {
                label: "Povolit spoluvlastníkům hlasovat samostatně?",
                description:
                    "Pokud je povoleno, každý spoluvlastník jednotky může hlasovat samostatně, místo aby museli zvolit jednoho společného zástupce.",
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
            finish: "Přejít na náhled hlasování",
        },
        toast: {
            createSuccess: "Hlasování bylo úspěšně vytvořeno",
            updateSuccess: "Hlasování bylo úspěšně uloženo",
            error: "Vytvoření hlasování se nezdařilo",
            rulesetError: "Nepodařilo se nastavit pravidla hlasování",
            rulesetSuccess: "Pravidla byla úspěšně nastavena",
            scheduleSuccess: "Hlasování bylo úspěšně naplánováno",
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
            DRAFT: "Koncept",
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
            draftStatus: "Koncept hlasování",
            editDraft: "Konfigurace není kompletní",
            editAction: "Upravit hlasování",
        },
    },
    detail: {
        timeline: {
            startDate: "DATUM ZAHÁJENÍ",
            endDate: "DATUM UKONČENÍ",
            notSet: "Nenastaveno",
        },
        description: {
            title: "Popis",
        },
        actions: {
            edit: "Upravit hlasování",
            schedule: "Naplánovat hlasování",
            scheduleConfirmTitle: "Naplánovat hlasování",
            scheduleConfirmDescription:
                "Opravdu chcete toto hlasování naplánovat? Tato akce zpřístupní hlasování běžným uživatelům a nelze ji vzít zpět. Po naplánování již nebude možné upravovat detaily hlasování ani ruleset.",
            cancel: "Zrušit",
            confirm: "Ano, naplánovat hlasování",
        },
        validation: {
            title: "Neúplná konfigurace hlasování",
            description:
                "Před naplánováním tohoto hlasování je nutné vyřešit následující problémy:",
            goToEdit: "Přejít na úpravu",
            close: "Zavřít",
            errors: {
                VOTE_SCHEDULE_MISSING_DATES:
                    "Je nutné nastavit datum začátku i konce.",
                VOTE_SCHEDULE_IN_PAST:
                    "Naplánovaná data nemohou být v minulosti.",
                VOTE_SCHEDULE_INVALID_RANGE:
                    "Datum začátku musí být před datem konce.",
                VOTE_MISSING_QUESTIONS:
                    "K hlasování musí být přidána alespoň jedna otázka.",
                VOTE_QUESTION_MISSING_OPTIONS:
                    "Otázka „{{param}}“ musí mít alespoň dvě možnosti odpovědi.",
                VOTE_RULESET_REQUIRED: "Musí být nastaven výchozí ruleset.",
            },
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
            customRules: "(vlastní pravidla)",
        },
        statusSidebar: {
            title: "Váš status hlasování",
            closesIn: "Hlasování končí za",
            owningUnits: "VLASTNĚNÉ JEDNOTKY",
            share: "Podíl:",
            statusReady: "Připraveno",
            statusDelegation: "Vyžaduje delegaci",
            statusVoted: "Odhlasováno",
            delegationWarning:
                "{{unitName}} je ve spoluvlastnictví. Pro hlasování za tuto jednotku je vyžadován formulář delegace.",
            manageDelegation: "Spravovat delegaci",
            totalPower: "Celková síla hlasu:",
            voteButton: "Hlasovat",
            secureBoothHint:
                "Kliknutím na „Hlasovat“ vstoupíte do zabezpečené hlasovací místnosti.",
            help: {
                title: "Máte dotazy?",
                description:
                    "Pokud máte dotazy k jednotlivým bodům, kontaktujte předsedu.",
                contact: "Kontaktovat předsedu",
            },
            time: {
                hour: "hodina",
                hours: "hodin",
            },
        },
    },
};
