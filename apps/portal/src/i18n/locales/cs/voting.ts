export const voting = {
    navigation: {
        activeVotes: "Probíhající hlasování",
        results: "Výsledky",
        createVote: "Vytvořit hlasování",
        delegations: "Delegace",
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
        legalValidityDisclaimer: {
            title: "Upozornění na právní platnost",
            description:
                "Zvolená nastavení se odchylují od standardních zákonných pravidel (váha podle podílu, kvorum ze všech jednotek). Ujistěte se, že tato pravidla jsou v souladu s vašimi stanovami, jinak může být hlasování právně napadnutelné.",
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
            endedOn: "Ukončeno ",
            noDescription: "Nebyl poskytnut žádný popis.",
            canVote: "Můžete hlasovat",
            voteRequired: "Váš hlas je vyžadován.",
            voteAction: "Hlasovat",
            delegationNeeded: "Je potřeba delegace",
            fromCoOwners: "Od spoluvlastníků",
            manageDelegation: "Spravovat delegaci",
            readyToVote: "Připraveni k hlasování",
            readyToVoteSubtitle: "Jste oprávněni, jakmile hlasování začne.",
            viewDetails: "Zobrazit detail",
            alreadyDelegated: "Delegováno",
            alreadyDelegatedSubtitle: "Zvolili jste společného zástupce.",
            scheduledStatus: "Naplánováno",
            scheduledSubtitle: "Toto hlasování ještě nezačalo.",
            alreadyDelegatedOpen: "Delegováno",
            alreadyDelegatedOpenSubtitle:
                "Jiní spoluvlastníci zvolili zástupce pro vaše jednotky.",
            cannotVoteOpen: "Nemůžete hlasovat",
            cannotVoteOpenSubtitle:
                "Žádná z vašich jednotek není v tomto hlasování oprávněna.",
            completed: "Hlasování dokončeno",
            viewOutcomes: "Zobrazit konečné výsledky",
            viewResults: "Zobrazit výsledky",
            voted: "Odhlasováno",
            votedSubtitle: "Váš hlas byl již zaznamenán.",
            alreadyVotedAction: "Již odhlasováno",
            draftStatus: "Koncept hlasování",
            editDraft: "Konfigurace není kompletní",
            editAction: "Upravit hlasování",
        },
    },
    resultsOverview: {
        title: "Výsledky hlasování",
        description: "Přehled výsledků a záznamů ukončených hlasování.",
        empty: "Nebyly nalezeny žádné ukončené hlasování.",
        error: "Nepodařilo se načíst výsledky hlasování.",
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
            opensIn: "Hlasování začíná",
            closesIn: "Hlasování končí",
            owningUnits: "VLASTNĚNÉ JEDNOTKY",
            share: "Podíl:",
            statusReady: "Připraveno",
            statusDelegation: "Vyžaduje delegaci",
            statusVoted: "Odhlasováno",
            statusDelegated: "Delegováno",
            statusIneligible: "Nepovolaný",
            ineligibleReasons: {
                NO_REPRESENTATIVE: "Nebyl zvolen společný zástupce.",
                MISSING_OWNERSHIP:
                    "Chybí informace o vlastnictví v době zahájení.",
            },
            delegationWarning:
                "{{unitName}} je v podílovém spoluvlastnictví. Musí být zvolen společný zástupce.",
            manageDelegation: "Spravovat delegaci",
            totalPower: "Celková síla hlasu:",
            voteButton: "Hlasovat",
            alreadyVotedButton: "Již odhlasováno",
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
    delegate: {
        title: "Delegovat hlas",
        backToVote: "Zpět na detail hlasování",
        votingEvent: "Hlasování",
        cancelExisting: "Zrušit delegaci",
        selectUnit: "Vyberte jednotku",
        whoWillRepresent: "Kdo vás bude zastupovat?",
        searchByCoOwner: "Hledat spoluvlastníky podle jména",
        noCandidatesFound: "Nebyli nalezeni žádní způsobilí spoluvlastníci.",
        noSelectableUnits:
            "Všechny vaše jednotky jsou již v tomto hlasování delegovány.",
        assignedToYou: "Pověřil(a) vás",
        alreadyDelegated: "Již delegoval(a)",
        confirmButton: "Potvrdit delegaci",
        confirming: "Potvrzování...",
        terms: 'Kliknutím na "Potvrdit delegaci" souhlasíte s podmínkami digitálního hlasování portálu SVJ.',
        notice: {
            title: "Důležité upozornění",
            description:
                "Jakmile delegujete svůj hlas pro tuto jednotku, nemůžete v tomto konkrétním hlasování hlasovat osobně, dokud delegaci nezrušíte před začátkem hlasování.",
        },
        summary: {
            title: "Přehled delegace",
            unit: "Jednotka",
            voteShare: "Hlasovací podíl",
            delegate: "Zástupce",
            notSelected: "Nevybráno",
        },
        modal: {
            title: "Potvrdit delegaci",
            description:
                "Zkontrolujte prosím údaje o delegaci před potvrzením.",
            warning:
                "Potvrzením zmocňujete vybraného zástupce, aby hlasoval vaším jménem pro tuto jednotku. Toto můžete vzít zpět před začátkem hlasování.",
            toast: {
                success: "Delegace byla úspěšně vytvořena",
                error: "Nepodařilo se vytvořit delegaci",
            },
            delegateLabel: "ZÁSTUPCE",
            delegateSubtext: "Oprávněná osoba",
            unitLabel: "JEDNOTKA",
            unitSubtext: "Nemovitost",
            eventLabel: "HLASOVÁNÍ",
            eventSubtext: "Bod programu",
            revocableTitle: "Akce je odvolatelná",
            revocableDescription:
                "Tuto delegaci můžete kdykoli před začátkem hlasování zrušit ve svém přehledu.",
            terms: "Pokračováním potvrzujete, že tato delegace je v souladu se stanovami SVJ. Tato akce uděluje plnou hlasovací moc pro tento konkrétní bod programu určenému zástupci uvedenému výše.",
            allowAction: "Povolit osobě hlasovat mým jménem",
        },
    },
    delegations: {
        title: "Delegace",
        description: "Spravujte, kdo může hlasovat vaším jménem.",
        tabs: {
            myDelegations: "Moje delegace",
            recordProxy: "Evidence plné moci (Admin)",
        },
        table: {
            unit: "Jednotka",
            vote: "Hlasování",
            from: "Zmocnitel",
            to: "Zmocněnec",
            date: "Evidováno dne",
            actions: "Akce",
            revoke: "Zrušit",
            revokeSuccess: "Delegace byla úspěšně zrušena",
        },
        empty: {
            title: "Žádné delegace nebyly nalezeny",
            description:
                "Zatím jste nikomu svůj hlas nedelegovali a nikdo nedelegoval hlas vám.",
            all: "Nebyly nalezeny žádné aktivní delegace.",
            filtered: "Pro vybrané hlasování nebyly nalezeny žádné delegace.",
        },
        filter: {
            vote: "Filtrovat podle hlasování",
            allVotes: "Všechna naplánovaná hlasování",
        },
        admin: {
            title: "Evidovat plnou moc",
            description:
                "Jako administrátor můžete zaevidovat plnou moc na základě fyzického dokumentu doloženého vlastníkem.",
            selectVote: "Vyberte hlasování",
            selectUnit: "Vyberte jednotku",
            selectOwner: "Zmocnitel",
            selectDelegate: "Zmocněnec",
            success: "Plná moc byla úspěšně zaevidována",
        },
    },
    castVote: {
        error: "Nepodařilo se načíst hlasování. Zkuste to prosím znovu.",
        votingFor: "HLASOVÁNÍ ZA",
        voteShare: "Podíl na hlasování",
        voteShareLabel: "Podíl na hlasování",
        progress: {
            question: "Otázka {{current}} z {{total}}",
            completed: "Dokončeno",
        },
        options: {
            yes: "Pro",
            no: "Proti",
            abstain: "Zdržuji se",
        },
        navigation: {
            previous: "Předchozí otázka",
            next: "Další otázka",
            review: "Zkontrolovat odpovědi",
        },
        review: {
            title: "Kontrola vašeho hlasu",
            subtitle:
                "Před odesláním zkontrolujte své volby. Po odeslání tuto akci nelze vrátit zpět.",
            selectedChoices: "Vybrané možnosti",
            editAnswers: "Upravit odpovědi",
            submitVote: "Odeslat hlas",
        },
        success: {
            title: "Hlas byl zaznamenán!",
            subtitle: "Váš hlas byl úspěšně zaznamenán v systému.",
            timestamp: "Čas zaznamenání",
            backToDashboard: "Zpět na přehled",
        },
        alreadyVoted: {
            title: "Hlas byl úspěšně zaznamenán",
            description:
                "Váš hlas pro toto hlasování byl již v systému uložen. Průběh můžete sledovat v detailu hlasování.",
        },
        noUnits: {
            title: "Žádné jednotky k hlasování",
            description:
                "V tomto hlasování nemáte žádné další jednotky, za které by bylo možné odevzdat hlas.",
        },
        backToDetail: "Zpět na detail hlasování",
    },
    results: {
        pageTitle: "Výsledky",
        breadcrumbVoting: "Hlasování",
        finalizedAt: "Uzavřeno",
        approved: "Schváleno",
        rejected: "Zamítnuto",
        quorum: "Kvorum",
        inFavor: "Pro",
        finalResolution: "Výsledek hlasování",
        majorityThresholdNote:
            "Kvalifikovaná většina vyžaduje: {{threshold}}% oprávněných hlasů.",
        quorumValidation: "Ověření kvora",
        quorumMet:
            "Práh účasti byl dosažen. Požadované kvorum bylo překročeno.",
        quorumNotMet:
            "Práh účasti nebyl dosažen. Požadované kvorum nebylo splněno.",
        totalEligibleUnits: "Celkem oprávněných jednotek",
        votesCast: "Odevzdané hlasy",
        participationWeight: "Váha účasti",
        resolutionDetails: "Usnesení {{index}} – {{title}}",
        viewResults: "Zobrazit výsledky",
        unitCount_one: "{{count}} jednotka",
        unitCount_few: "{{count}} jednotky",
        unitCount_other: "{{count}} jednotek",
        weightLabel: "podílu",
        invalid: "Neplatné",
        invalidQuorum: "Chybí kvórum",
    },
};
