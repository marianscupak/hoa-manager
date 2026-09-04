export const voting = {
    hub: {
        title: "Hlasování",
        newVote: "Nové hlasování",
        tabs: {
            active: "Aktivní a nadcházející",
            results: "Výsledky",
            delegations: "Plné moci",
        },
        groups: {
            needsAction: "Vyžaduje vaši akci",
            upcoming: "Nadcházející a probíhající",
            drafts: "Rozpracovaná",
        },
        continueEditing: "Pokračovat v úpravách",
    },
    common: {
        save: "Uložit",
        cancel: "Zrušit",
    },
    mode: {
        PER_ROLLAM: {
            label: "Per rollam",
        },
        ASSEMBLY_RECORD: {
            label: "Záznam shromáždění",
        },
    },
    rules: {
        sentence:
            "Ke schválení je potřeba {{majority}} {{denominator}}, {{weighting}}.",
        majoritySimple: "prostá většina (více než 50 %)",
        majorityQualified: "kvalifikovaná většina (alespoň {{threshold}} %)",
        majorityUnanimity: "jednomyslný souhlas (100 %)",
        ofVotesCast: "z odevzdaných hlasů",
        ofAllVotes: "ze všech hlasů",
        ofVotesCastExclAbstain: "z odevzdaných hlasů (bez zdržení se)",
        weightedByShares: "vážených podle vlastnických podílů",
        onePerUnit: "jeden hlas za jednotku",
        inPlainLanguage: "Srozumitelně řečeno",
        customRule: "vlastní pravidlo",
    },
    create: {
        description: "Nastavte nové hlasování pro společenství.",
        mode: {
            PER_ROLLAM: {
                title: "Hlasování per rollam",
                description:
                    "Písemné hlasování mimo zasedání. Rozhoduje většina hlasů **všech** vlastníků; lhůta min. 15 dnů.",
            },
            ASSEMBLY_RECORD: {
                title: "Záznam shromáždění",
                description:
                    "Zápis výsledků prezenčního shromáždění. Kvórum nadpoloviční většiny všech hlasů; rozhoduje většina přítomných.",
            },
        },
        steps: {
            mode: {
                title: "Typ hlasování",
                description:
                    "Vyberte, zda se jedná o hlasování per rollam, nebo o záznam shromáždění. Po vytvoření hlasování už typ nelze změnit.",
            },
            basicInfo: {
                title: "Základní údaje",
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
                        "Přepíše pravidla většiny pouze pro tuto otázku. Usnášeníschopnost se vždy posuzuje pro celé hlasování.",
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
                cards: {
                    UNIT_SHARE: {
                        hint: "Hlasy vážené podle podílu",
                    },
                    ONE_UNIT_ONE_VOTE: {
                        hint: "Každá jednotka má stejnou váhu",
                    },
                },
            },
            quorum: {
                label: "Kvórum",
                perRollamNone:
                    "Hlasování per rollam nemá kvórum — většina se počítá ze všech hlasů v domě.",
            },
            quorumMeasure: {
                options: {
                    UNIT_SHARE: "Podle podílu",
                    UNIT_COUNT: "Podle počtu jednotek",
                },
            },
            majorityRuleType: {
                label: "Typ většiny",
                placeholder: "Vyberte typ většiny",
                options: {
                    SIMPLE_MAJORITY: "Prostá většina (>50 %)",
                    QUALIFIED_MAJORITY: "Kvalifikovaná většina",
                    UNANIMITY: "Jednomyslnost (100 %)",
                },
            },
            majorityDenominatorBasis: {
                label: "Základ pro výpočet většiny",
                options: {
                    VOTES_CAST: "Z odevzdaných hlasů",
                    ALL_VOTES: "Ze všech hlasů",
                },
            },
            majorityThreshold: {
                label: "Požadovaná většina",
                errors: {
                    requiredForQualified:
                        "Při kvalifikované většině je nutné vyplnit",
                },
            },
            allowAbstain: {
                label: "Povolit možnost 'Zdržuji se'?",
                description:
                    "Umožní hlasujícím se výslovně zdržet hlasování v otázkách.",
            },
            time: "Čas",
        },
        thresholdPicker: {
            customLabel: "Vlastní zlomek",
            customPlaceholder: "Např. 3/5 nebo 60 %",
            comparatorLabel: "Podmínka",
            comparator: {
                AT_LEAST: "alespoň",
                STRICT_GREATER: "více než",
            },
        },
        legal: {
            tier1: {
                MAJORITY_BELOW_FLOOR:
                    "Požadovaná většina nesmí být nižší než nadpoloviční většina (více než 50 %).",
                PER_ROLLAM_QUORUM_PRESENT:
                    "Hlasování per rollam nesmí mít nastaveno kvórum.",
                PER_ROLLAM_BASIS_NOT_ALL_VOTES:
                    "Hlasování per rollam musí počítat většinu ze všech hlasů, nikoli jen z odevzdaných.",
                ASSEMBLY_QUORUM_MISSING:
                    "Záznam shromáždění musí mít nastaveno kvórum.",
                ASSEMBLY_QUORUM_BELOW_FLOOR:
                    "Kvórum shromáždění nelze nastavit pod nadpoloviční většinu všech hlasů.",
            },
            tier3: {
                ONE_UNIT_ONE_VOTE: "hlasování jedna jednotka = jeden hlas",
                UNIT_COUNT_QUORUM: "kvórum podle počtu jednotek",
            },
            ackLabel:
                "Potvrzuji, že stanovy našeho SVJ výslovně umožňují: {{deviations}}",
            overrideStricterOnly:
                "Přepsání může pravidla většiny pouze zpřísnit, nikdy zmírnit.",
        },
        documents: {
            title: "Dokumenty",
            description:
                "Přiložte podpůrné dokumenty (PDF, Word, Excel, obrázky). Max. 50 MB na soubor.",
            add: "Přidat dokument",
            uploading: "Nahrávání…",
            retry: "Zkusit znovu",
            dismiss: "Zavřít",
            tooLarge: "Soubor přesahuje limit 50 MB.",
            typeNotAllowed: "Tento typ souboru není povolen.",
            limitReached: "Hlasování může mít nejvýše 20 dokumentů.",
            uploadFailed: "Nahrávání se nezdařilo.",
            queued: "Ve frontě",
            queuedHint: "Soubory se nahrají po uložení údajů hlasování.",
            uploadsIncomplete:
                "Některé dokumenty se nepodařilo nahrát. Zkuste to znovu, nebo je odeberte a pokračujte.",
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
    wizard: {
        newVote: "Nové hlasování",
        exit: "Zavřít",
        draft: "Koncept",
        saved: "Všechny změny uloženy",
        unsaved: "Neuložené změny",
        saving: "Ukládám…",
        railTitle: "Nastavení v 5 krocích",
        steps: {
            mode: "Typ hlasování",
            details: "Základní údaje",
            rules: "Pravidla hlasování",
            questions: "Otázky",
            review: "Kontrola a naplánování",
        },
        note: "Koncept se ukládá automaticky po dokončení každého kroku. Vlastníci nic nevidí, dokud hlasování nenaplánujete.",
        back: "Zpět",
        continue: "Pokračovat",
        toReview: "Kontrola",
        stepOf: "Krok {{n}} ze {{total}}",
        review: {
            title: "Kontrola a naplánování",
            edit: "Upravit",
            scheduleTitle: "Naplánovat hlasování?",
            scheduleCopy:
                "Po naplánování budou vlastníci informováni a nastavení už nepůjde upravit.",
            keepDraft: "Ponechat jako koncept",
            scheduleAction: "Naplánovat hlasování",
            quorumLine: "Kvórum: {{comparator}} {{threshold}}.",
            majorityLine: "Většina: {{comparator}} {{threshold}}.",
            checks: {
                VOTE_SCHEDULE_MISSING_DATES:
                    "Datum zahájení a ukončení je vyplněno",
                VOTE_SCHEDULE_IN_PAST: "Zahájení je v budoucnosti",
                VOTE_SCHEDULE_INVALID_RANGE: "Ukončení následuje po zahájení",
                VOTE_RULESET_REQUIRED: "Pravidla hlasování jsou nastavena",
                VOTE_MISSING_QUESTIONS: "Existuje alespoň jedna otázka",
                VOTE_QUESTION_MISSING_OPTIONS:
                    "Každá otázka má možnosti odpovědí",
                SHORT_VOTING_PERIOD: "Hlasování trvá alespoň 15 dní",
            },
        },
    },
    list: {
        error: "Nepodařilo se načíst hlasování.",
        empty: {
            all: "Nebyla nalezena žádná hlasování.",
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
            voteRequired: "Váš hlas je vyžadován.",
            voteAction: "Hlasovat",
            manageDelegation: "Spravovat delegaci",
            readyToVoteSubtitle: "Jste oprávněni, jakmile hlasování začne.",
            viewDetails: "Zobrazit detail",
            alreadyDelegatedSubtitle: "Zvolili jste společného zástupce.",
            scheduledSubtitle: "Toto hlasování ještě nezačalo.",
            alreadyDelegatedOpenSubtitle:
                "Jiní spoluvlastníci zvolili zástupce pro vaše jednotky.",
            cannotVoteOpenSubtitle:
                "Žádná z vašich jednotek není v tomto hlasování oprávněna.",
            viewOutcomes: "Zobrazit konečné výsledky",
            viewResults: "Zobrazit výsledky",
            votedSubtitle: "Váš hlas byl již zaznamenán.",
            alreadyVotedAction: "Již odhlasováno",
            editDraft: "Konfigurace není kompletní",
        },
    },
    resultsOverview: {
        empty: "Nebyly nalezeny žádné ukončené hlasování.",
        error: "Nepodařilo se načíst výsledky hlasování.",
    },
    outcomes: {
        APPROVED: "Schváleno",
        REJECTED: "Zamítnuto",
        NOT_DECIDED: "Nerozhodnuto",
        winner: "Vítězí {{option}}",
    },
    status: {
        requiresDelegation:
            "K hlasování za jednotku je potřeba zmocnit společného zástupce (souhlasem spoluvlastníků s nadpoloviční většinou podílů).",
        requiresDelegationSjm:
            "U jednotky ve společném jmění manželů musí zástupce potvrdit i druhý z manželů.",
        readyCanDelegate:
            "Nemůžete hlasovat osobně? Zařiďte si zastoupení, dokud hlasování nezačne.",
    },
    detail: {
        backToVoting: "Hlasování",
        metaLine: "Zahájeno {{opened}} · končí {{closes}} ({{relative}})",
        metaLineEnded: "Zahájeno {{opened}} · ukončeno {{closes}}",
        timeline: {
            startDate: "DATUM ZAHÁJENÍ",
            endDate: "DATUM UKONČENÍ",
            notSet: "Nenastaveno",
        },
        description: {
            title: "Popis",
        },
        about: {
            title: "O tomto hlasování",
        },
        actions: {
            edit: "Upravit hlasování",
            schedule: "Naplánovat hlasování",
            scheduleConfirmTitle: "Naplánovat hlasování",
            scheduleConfirmDescription:
                "Opravdu chcete toto hlasování naplánovat? Tato akce zpřístupní hlasování běžným uživatelům a nelze ji vzít zpět. Po naplánování již nebude možné upravovat detaily hlasování ani ruleset.",
            cancel: "Zrušit",
            confirm: "Ano, naplánovat hlasování",
            delete: "Smazat koncept",
            deleteConfirmTitle: "Smazat koncept hlasování",
            deleteConfirmDescription:
                "Opravdu chcete tento koncept smazat? Všechny otázky, možnosti a nastavení pravidel budou trvale odstraněny. Tuto akci nelze vrátit zpět.",
            deleteConfirm: "Ano, smazat koncept",
            deleteSuccess: "Koncept hlasování byl smazán",
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
                VOTE_WINDOW_TOO_SHORT_PER_ROLLAM:
                    "Hlasovací okno per rollam musí trvat alespoň 15 dnů.",
            },
        },
        documents: {
            download: "Stáhnout",
            delete: "Odebrat",
            empty: "Žádné přiložené dokumenty.",
        },
        questions: {
            title: "Položky k hlasování",
        },
        statusSidebar: {
            title: "Váš status hlasování",
            opensIn: "Hlasování začíná",
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
                ASSOCIATION_OWNED:
                    "Jednotka je ve vlastnictví společenství a nemá hlasovací právo.",
            },
            manageDelegation: "Spravovat delegaci",
            arrangeDelegation: "Zařídit zastoupení",
            totalPower: "Celková síla hlasu:",
            totalPowerVotes_one: "{{count}} hlas",
            totalPowerVotes_few: "{{count}} hlasy",
            totalPowerVotes_other: "{{count}} hlasů",
            voteButton: "Hlasovat",
            alreadyVotedButton: "Již odhlasováno",
            ballotsFinal: "Odevzdané hlasy jsou konečné a nelze je změnit.",
            help: {
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
        searchByCoOwner: "Hledat zástupce podle jména",
        noCandidatesFound: "Nebyli nalezeni žádní způsobilí zástupci.",
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
                "Společný zástupce se volí souhlasem spoluvlastníků s nadpoloviční většinou podílů. Jakmile delegujete svůj hlas pro tuto jednotku, nemůžete v tomto konkrétním hlasování hlasovat osobně, dokud delegaci nezrušíte před začátkem hlasování.",
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
    delegation: {
        coOwner: "Spoluvlastník",
    },
    delegations: {
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
            revoke: "Zrušit",
            revokeSuccess: "Delegace byla úspěšně zrušena",
            searchPlaceholder: "Hledat delegace",
            range: "Zobrazeno {{from}}–{{to}} z {{total}} delegací",
            count_one: "{{count}} delegace",
            count_few: "{{count}} delegace",
            count_other: "{{count}} delegací",
        },
        empty: {
            title: "Žádné delegace nebyly nalezeny",
            description:
                "Zatím jste nikomu svůj hlas nedelegovali a nikdo nedelegoval hlas vám.",
            all: "Zatím nemáte žádné zastoupení. Zařídíte ho v detailu naplánovaného hlasování, dokud hlasování nezačne.",
            filtered: "Pro vybrané hlasování nebyly nalezeny žádné delegace.",
            search: "Vašemu hledání neodpovídají žádné delegace.",
        },
        filter: {
            vote: "Filtrovat podle hlasování",
            allVotes: "Všechna naplánovaná hlasování",
        },
        footnote: "Plnou moc může za vlastníka zaznamenat i výbor.",
        admin: {
            title: "Evidovat plnou moc",
            description:
                "Jako administrátor můžete zaevidovat plnou moc na základě fyzického dokumentu doloženého vlastníkem.",
            selectVote: "Vyberte hlasování",
            selectUnit: "Vyberte jednotku",
            selectOwner: "Zmocnitel",
            selectDelegate: "Zmocněnec",
            success: "Plná moc byla úspěšně zaevidována",
            errors: {
                vote: "Vyberte hlasování",
                unit: "Vyberte jednotku",
                owner: "Vyberte vlastníka",
                delegate: "Vyberte zmocněnce",
            },
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
        breadcrumbVoting: "Hlasování",
        viewResults: "Zobrazit výsledky",
        unitCount_one: "{{count}} jednotka",
        unitCount_few: "{{count}} jednotky",
        unitCount_other: "{{count}} jednotek",
        downloadAuditReport: "Stáhnout audit report",
        downloadAuditReportError: "Nepodařilo se stáhnout audit report.",
        tabs: {
            results: "Výsledky",
            activity: "Průběh hlasování",
        },
        activity: {
            empty: "Pro toto hlasování nejsou žádné události k zobrazení.",
            error: "Nepodařilo se načíst průběh hlasování.",
            expandDetails: "Zobrazit detaily",
            collapseDetails: "Skrýt detaily",
        },
        perRollamDenominator: "Většina se počítá ze všech hlasů v domě.",
    },
    resultsV2: {
        participationLine:
            "Zúčastnili se vlastníci s {{pct}} % podílů ({{units}} z {{total}} jednotek).",
        participationLineUnits:
            "Hlasovalo {{pct}} % jednotek ({{units}} z {{total}} jednotek).",
        participationExactTitle:
            "Přesně: {{participationNum}}/{{participationDen}} z {{totalNum}}/{{totalDen}}",
        quorumMetLine: "Usnášeníschopnost {{threshold}} % byla splněna.",
        quorumNotMetLine:
            "Usnášeníschopnost {{threshold}} % nebyla splněna — usnesení nejsou rozhodnuta.",
        thresholdCaption:
            "Práh: {{comparator}} {{fraction}} (základ {{denominator}})",
        thresholdDenominatorShare: "{{percent}} % podílů",
        thresholdExactTitle: "Přesný základ: {{num}}/{{den}}",
        multipleChoice: "více možností",
        ranLine:
            "Hlasování probíhalo {{from}} – {{to}} · výsledky vypočteny {{computed}}",
        footnote:
            "Procenta v grafech jsou podíly z celé budovy (u hlasování počítaných po jednotkách podíly ze všech jednotek); každý verdikt uvádí svůj vlastní základ. Pravidla většiny se vyhodnocují pro každou otázku podle jejích pravidel; usnášeníschopnost platí pro celé hlasování.",
        resolutionLabel: "Usnesení {{index}}",
        didntVote: "Nehlasovalo",
        winnerChip: "vítěz",
        reasonApproved:
            "Pro hlasovalo {{pct}} % odevzdaných hlasů — více než požadovaná {{majority}}.",
        reasonRejected:
            "Pro hlasovalo jen {{pct}} % odevzdaných hlasů — méně než požadovaná {{majority}}.",
        reasonWinner:
            "„{{option}}“ získala {{pct}} % odevzdaných hlasů — většinu.",
        reasonNoQuorum:
            "Zúčastnilo se jen {{turnout}} % — méně než {{threshold}} % potřebných pro usnášeníschopnost, usnesení proto není rozhodnuto (i když většina odevzdaných hlasů mohla být pro).",
        reasonNoMajority: "Žádná možnost nedosáhla požadované většiny.",
    },
};
