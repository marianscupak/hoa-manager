export const voting = {
    hub: {
        title: "Hlasování",
        newVote: "Nové hlasování",
        tabs: {
            active: "Aktivní a nadcházející",
            results: "Výsledky",
            delegations: "Zastoupení",
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
        ofAllVotes: "hlasovacích podílů bylo přítomno",
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
                        errors: {
                            required: "Znění otázky je vyžadováno",
                        },
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
                    errors: {
                        required: "Text možnosti je vyžadován",
                        atLeastTwo:
                            "Výběr z možností potřebuje alespoň dvě možnosti.",
                    },
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
            meetingDate: {
                label: "Datum a čas konání zasedání",
                description: "Kdy se zasedání konalo?",
            },
            scheduledFrom: {
                label: "Začátek hlasování",
                description: "Kdy se má hlasování automaticky otevřít?",
            },
            scheduledTo: {
                label: "Konec hlasování",
                description: "Kdy se má hlasování automaticky uzavřít?",
                errors: {
                    beforeStart: "Konec hlasování musí být až po jeho začátku.",
                    tooShortPerRollam:
                        "Hlasování per rollam musí trvat nejméně 15 dní. Posuňte konec hlasování dál.",
                },
            },
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
                assemblyHint:
                    "Ze zákona rozhoduje většina přítomných. Přísnější variantu zvolte jen tehdy, vyžadují-li ji vaše stanovy.",
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
                "Přiložte vše, co si vlastníci mají přečíst před hlasováním.",
            dropzone: "Přetáhněte sem dokumenty nebo je vyberte",
            dropzoneHint:
                "PDF, Word, Excel nebo obrázky · max. 50 MB na soubor",
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
    assemblyRecord: {
        entry: {
            title: "Záznam ze zasedání",
            prompt: "Zasedání proběhlo. Zapište sebrané hlasy a záznam publikujte — vlastníci ho uvidí až potom.",
            action: "Zaznamenat zasedání",
        },
        loadError: "Nepodařilo se načíst záznam ze zasedání.",
        noUnits: "V tomto společenství nejsou žádné jednotky.",
        header: {
            title: "Záznam ze zasedání · {{title}}",
            heldOn: "Zasedání {{date}} · zapisují se sebrané hlasy",
            noDate: "Datum konání není vyplněno",
            exit: "Ukončit zápis",
            exitPublished: "Zpět na hlasování",
            heldOnPublished: "Zasedání {{date}} · záznam publikován",
            recording: "Zapisuje se",
            closed: "Uzavřeno",
            hidden: "Skryto vlastníkům",
            visible: "Viditelné vlastníkům",
        },
        attendance: {
            ofAllVotes: "všech hlasů bylo přítomno",
            quorate: "Usnášeníschopné",
            belowQuorum: "Pod hranicí",
            presentOf: "{{present}} z {{total}} jednotek přítomno",
            absentAndNoOwner:
                "{{absent}} nepřítomno · {{ineligible}} nemůže hlasovat",
            quorumRule:
                "Usnášeníschopnost vyžaduje víc než polovinu všech hlasů",
            sharesOnRecord: "Podíly v evidenci: {{num}}/{{den}}",
        },
        tally: {
            eyebrow: "Průběžný počet",
            entered: "zadáno {{entered}} z {{present}} přítomných jednotek",
            units_one: "{{count}} jednotka",
            units_few: "{{count}} jednotky",
            units_other: "{{count}} jednotek",
            footnoteShare:
                "Jen pro výbor · podíly ze všech hlasů v domě · průběžné do publikace",
            footnoteUnits: "Jen pro výbor · průběžné do publikace",
        },
        roster: {
            search: "Hledat jednotku nebo vlastníka…",
            noOwner: "Bez zapsaného vlastníka",
            showing: "Zobrazeno {{shown}} z {{total}} jednotek",
            filters: {
                all: "Vše",
                todo: "K zadání",
                present: "Přítomné",
                absent: "Nepřítomné",
            },
            marker: {
                toEnter: "k zadání",
                absent: "nepřítomna",
                ineligible: "nemůže hlasovat",
                unset: "nezadáno",
                complete: "",
            },
        },
        unit: {
            eyebrow: "Jednotka {{index}} z {{total}}",
            share: "podíl {{num}}/{{den}} ({{percent}} všech hlasů)",
            coOwned: "Spoluvlastněná",
            prev: "Předchozí jednotka",
            next: "Další jednotka",
            attendanceQuestion: "Byla jednotka na zasedání zastoupena?",
            present: "Přítomna",
            presentHint: "Počítá se do usnášeníschopnosti i do většiny.",
            presentNeedsVoter: "Nejdřív zvolte, kdo za jednotku hlasoval.",
            absent: "Nepřítomna",
            absentHint: "Za jednotku se nezaznamená žádný hlas.",
            voterQuestion: "Kdo za jednotku hlasoval?",
            voterOwner: "vlastník",
            voterProxy: "Někdo jiný na plnou moc",
            voterProxyPlaceholder: "Jméno zmocněnce",
            resolution: "Usnesení {{index}}",
            answersIncomplete:
                "Zbývá zodpovědět {{count}} usnesení — hlas se uloží, až budou vyplněná všechna.",
            answersFootnote:
                "Zapište, co uvádí zápis ze zasedání. Přítomná jednotka, která o usnesení nehlasovala, se zaznamená jako „zdržel se“.",
            absentExplainer:
                "Označeno jako nepřítomná — není co zapisovat. Většina se počítá z hlasů přítomných, takže {{percent}} této jednotky do ní nevstupuje. Do usnášeníschopnosti se tentýž podíl počítá dál.",
            ineligible: {
                MISSING_OWNERSHIP:
                    "Jednotka nemá zapsaného vlastníka. Do usnášeníschopnosti se počítá, ale hlasovat za ni nelze — vlastníka doplníte v evidenci jednotek.",
                ASSOCIATION_OWNED:
                    "Jednotku vlastní společenství, takže nehlasuje a do usnášeníschopnosti se nepočítá.",
            },
        },
        footer: {
            autosave: "Průběžně uloženo",
            stillToEnter: "zbývá zadat {{count}} přítomných jednotek",
            allEntered: "všechny přítomné jednotky zadány",
            review: "Zkontrolovat a publikovat",
        },
        review: {
            back: "Zpět k zápisu",
            title: "Zkontrolujte záznam ze zasedání",
            lead: "Tohle je poslední místo, kde jde cokoli opravit. Publikací se spočítá výsledek a hlasování se zpřístupní vlastníkům.",
            attendanceEyebrow: "Docházka",
            statPresent: "přítomno · {{percent}} hlasů",
            statAbsent: "nepřítomno · {{percent}} hlasů",
            statIneligible: "nemůže hlasovat · {{percent}} hlasů",
            quorumOkTitle: "Zasedání bylo usnášeníschopné",
            quorumOkBody:
                "Přítomni byli vlastníci s {{percent}} všech hlasů, tedy s víc než polovinou. O usneseních rozhoduje většina hlasů přítomných.",
            quorumShortTitle: "Zasedání nebylo usnášeníschopné",
            quorumShortBody:
                "Přítomni byli vlastníci jen s {{percent}} všech hlasů. Nic, o čem se na zasedání hlasovalo, nelze přijmout — publikací se každé usnesení zaznamená jako nerozhodnuté.",
            checksEyebrow: "Před publikací",
            checks: {
                attendanceOkTitle:
                    "Docházka je zapsaná u všech jednotek ({{total}})",
                attendanceOkBody:
                    "{{present}} přítomno · {{absent}} nepřítomno · {{ineligible}} nemůže hlasovat",
                attendanceMissingTitle_one:
                    "U {{count}} jednotky není docházka zapsaná",
                attendanceMissingTitle_few:
                    "U {{count}} jednotek není docházka zapsaná",
                attendanceMissingTitle_other:
                    "U {{count}} jednotek není docházka zapsaná",
                attendanceMissingBody:
                    "Nezapsaná jednotka se do výsledku počítá jako nepřítomná.",
                attendanceEmptyTitle: "Zatím není zapsaná žádná docházka",
                attendanceEmptyBody:
                    "Záznam, ve kterém není zapsaná jediná jednotka, publikovat nelze.",
                attendanceAction: "Projít jednotky",
                answersOkTitle: "Každá přítomná jednotka má zapsaný hlas",
                answersOkBody_one: "Zapsán {{count}} hlas.",
                answersOkBody_few: "Zapsány {{count}} hlasy.",
                answersOkBody_other: "Zapsáno {{count}} hlasů.",
                answersMissingTitle_one:
                    "{{count}} přítomná jednotka nemá zapsaný hlas",
                answersMissingTitle_few:
                    "{{count}} přítomné jednotky nemají zapsaný hlas",
                answersMissingTitle_other:
                    "{{count}} přítomných jednotek nemá zapsaný hlas",
                answersMissingBody:
                    "Dokud hlasy nezadáte, jejich podíly se do většiny nepočítají.",
                answersActionAbstain: "Zapsat všem „zdržuji se“",
                answersActionGo: "Jít je zadat",
                quorumBody:
                    "Přítomno {{percent}} všech hlasů · potřeba víc než polovina",
                dateOkTitle: "Datum konání je vyplněné",
                dateMissingTitle: "Datum konání chybí",
                dateMissingBody:
                    "Bez data se vlastníci určí podle dnešního stavu, ne podle stavu v den zasedání.",
            },
            outcomesEyebrow: "Co se publikuje",
            resolution: "Usnesení {{index}}",
            reasonApproved:
                "Pro hlasovalo {{percent}} rozhodujících hlasů — nad hranicí {{threshold}}.",
            reasonRejected:
                "Pro hlasovalo {{percent}} rozhodujících hlasů — na hranici {{threshold}} to nestačí.",
            reasonWinner:
                "Nejvíc hlasů získala možnost {{option}} ({{percent}}).",
            reasonNoQuorum:
                "Zasedání nebylo usnášeníschopné, takže se usnesení nepřijalo.",
            reasonNoMajority: "Žádná z možností nedosáhla potřebné většiny.",
            denominatorVotesCast: "Procenta jsou z hlasů přítomných.",
            denominatorAllVotes: "Procenta jsou ze všech hlasů v domě.",
            noPreview:
                "Hlasování zatím nemá nastavená pravidla, takže výsledek spočítat nelze.",
            noQuestions: "Hlasování nemá žádná usnesení.",
            publishTitle: "Publikovat záznam",
            publishBody:
                "Publikací se hlasování uzavře, spočítá se výsledek a vlastníci hlasování i s výsledky uvidí poprvé. Zadané hlasy se stanou konečnými a už je nepůjde změnit — oprava by znamenala nový záznam.",
            confirm: "Potvrzuji, že záznam odpovídá zápisu ze zasedání.",
            confirmWithDate:
                "Potvrzuji, že záznam odpovídá zápisu ze zasedání konaného {{date}}.",
            publish: "Publikovat výsledky",
            keepRecording: "Pokračovat v zápisu",
            blocked: "Nejdřív doplňte, co chybí výš",
        },
        published: {
            title: "Záznam je publikovaný",
            lead: "Hlasování {{title}} je uzavřené a vlastníci ho vidí i s výsledky.",
            rowAttendance: "Docházka",
            rowAttendanceValue:
                "{{present}} z {{total}} jednotek · {{percent}}",
            rowBallots: "Zapsaných hlasů",
            rowVisibleTo: "Viditelné pro",
            rowVisibleToValue: "Všechny vlastníky jednotek",
            auditNote:
                "Každý zapsaný hlas je v protokolu i s tím, kdo ho zadal a kdy.",
            results: "Zobrazit výsledky",
            back: "Zpět na hlasování",
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
            reviewAssembly: "Kontrola a zápis",
        },
        note: "Koncept se ukládá automaticky po dokončení každého kroku. Vlastníci nic nevidí, dokud hlasování nenaplánujete.",
        back: "Zpět",
        continue: "Pokračovat",
        toReview: "Kontrola",
        stepOf: "Krok {{n}} ze {{total}}",
        review: {
            title: "Kontrola a naplánování",
            titleAssembly: "Kontrola a zápis",
            recordTitle: "Zapsat zasedání?",
            recordCopy:
                "Nastavení je hotové. Zápis se otevře a hlasy budete zadávat po jednotkách; vlastníci uvidí hlasování až po publikaci záznamu.",
            edit: "Upravit",
            scheduleTitle: "Naplánovat hlasování?",
            scheduleCopy:
                "Po naplánování budou vlastníci informováni a nastavení už nepůjde upravit.",
            keepDraft: "Ponechat jako koncept",
            scheduleAction: "Naplánovat hlasování",
            startRecordingAction: "Zahájit zápis",
            quorumLine: "Kvórum: {{comparator}} {{threshold}}.",
            majorityLine: "Většina: {{comparator}} {{threshold}}.",
            checks: {
                VOTE_SCHEDULE_MISSING_DATES:
                    "Datum zahájení a ukončení je vyplněno",
                ASSEMBLY_MEETING_DATE_MISSING:
                    "Datum konání zasedání je vyplněno",
                VOTE_SCHEDULE_IN_PAST: "Zahájení je v budoucnosti",
                VOTE_RULESET_REQUIRED: "Pravidla hlasování jsou nastavena",
                VOTE_MISSING_QUESTIONS: "Existuje alespoň jedna otázka",
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
            manageDelegation: "Spravovat zastoupení",
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
            "K hlasování za jednotku je potřeba určit společného zástupce (souhlasem spoluvlastníků s nadpoloviční většinou podílů).",
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
                "Opravdu chcete toto hlasování naplánovat? Tato akce zpřístupní hlasování běžným uživatelům a nelze ji vzít zpět. Po naplánování již nebude možné upravovat detaily hlasování ani jeho pravidla.",
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
                VOTE_QUESTION_MISSING_TITLE:
                    "Otázka „{{param}}“ musí mít vyplněné znění.",
                VOTE_RULESET_REQUIRED:
                    "Musí být nastavena výchozí pravidla hlasování.",
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
            statusDelegation: "Vyžaduje zástupce",
            statusVoted: "Odhlasováno",
            statusProxy: "Zastupujete",
            statusProxyHint:
                "Majitel jednotky vás vybral, abyste za ni hlasovali.",
            statusDelegated: "Zastoupeno",
            statusIneligible: "Nepovolaný",
            ineligibleReasons: {
                NO_REPRESENTATIVE: "Nebyl zvolen společný zástupce.",
                MISSING_OWNERSHIP:
                    "Chybí informace o vlastnictví v době zahájení.",
                ASSOCIATION_OWNED:
                    "Jednotka je ve vlastnictví společenství a nemá hlasovací právo.",
            },
            manageDelegation: "Spravovat zastoupení",
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
        risk: {
            noRepresentative: {
                title: "Jednotka by zůstala bez zástupce",
                description:
                    "Na stejné osobě se musí shodnout vlastníci s více než polovinou podílu a po této změně by ji nikdo neměl. Pokud jednotku vlastní manželé, musí stejnou osobu potvrdit i váš manžel nebo manželka, než hlasování začne.",
            },
        },
        title: "Určit zástupce",
        backToVote: "Zpět na detail hlasování",
        votingEvent: "Hlasování",
        cancelExisting: "Zrušit zastoupení",
        selectUnit: "Vyberte jednotku",
        whoWillRepresent: "Kdo vás bude zastupovat?",
        searchByCoOwner: "Hledat zástupce podle jména",
        noCandidatesFound: "Nebyli nalezeni žádní způsobilí zástupci.",
        noSelectableUnits:
            "Pro všechny vaše jednotky už jste v tomto hlasování určili zástupce.",
        assignedToYou: "Pověřil(a) vás",
        alreadyDelegated: "Zástupce už určen",
        confirmButton: "Potvrdit zastoupení",
        confirming: "Potvrzování...",
        terms: 'Kliknutím na "Potvrdit zastoupení" souhlasíte s podmínkami digitálního hlasování portálu SVJ.',
        notice: {
            title: "Důležité upozornění",
            description:
                "Společný zástupce se volí souhlasem spoluvlastníků s nadpoloviční většinou podílů. Jakmile pro tuto jednotku určíte zástupce, nemůžete v tomto konkrétním hlasování hlasovat osobně, dokud zastoupení nezrušíte před začátkem hlasování.",
        },
        summary: {
            title: "Přehled zastoupení",
            unit: "Jednotka",
            voteShare: "Hlasovací podíl",
            delegate: "Zástupce",
            notSelected: "Nevybráno",
        },
        modal: {
            title: "Potvrdit zastoupení",
            description:
                "Zkontrolujte prosím údaje o zastoupení před potvrzením.",
            warning:
                "Potvrzením zmocňujete vybraného zástupce, aby hlasoval vaším jménem pro tuto jednotku. Toto můžete vzít zpět před začátkem hlasování.",
            toast: {
                success: "Zastoupení bylo úspěšně vytvořeno",
                error: "Nepodařilo se vytvořit zastoupení",
            },
            delegateLabel: "ZÁSTUPCE",
            delegateSubtext: "Oprávněná osoba",
            unitLabel: "JEDNOTKA",
            unitSubtext: "Nemovitost",
            eventLabel: "HLASOVÁNÍ",
            eventSubtext: "Bod programu",
            revocableTitle: "Akce je odvolatelná",
            revocableDescription:
                "Toto zastoupení můžete kdykoli před začátkem hlasování zrušit ve svém přehledu.",
            terms: "Pokračováním potvrzujete, že toto zastoupení je v souladu se stanovami SVJ. Zástupce uvedený výše bude o tomto bodu programu hlasovat za vás.",
            allowAction: "Povolit osobě hlasovat mým jménem",
        },
    },
    delegation: {
        coOwner: "Spoluvlastník",
    },
    delegations: {
        tabs: {
            myDelegations: "Má zastoupení",
            recordProxy: "Evidence zastoupení (Admin)",
        },
        table: {
            unit: "Jednotka",
            vote: "Hlasování",
            from: "Vlastník",
            to: "Zástupce",
            date: "Evidováno dne",
            revoke: "Zrušit",
            revokeSuccess: "Zastoupení bylo úspěšně zrušeno",
            searchPlaceholder: "Hledat zastoupení",
            range: "Zobrazeno {{from}}–{{to}} z {{total}} zastoupení",
            count_one: "{{count}} zastoupení",
            count_few: "{{count}} zastoupení",
            count_other: "{{count}} zastoupení",
        },
        empty: {
            title: "Žádné zastoupení nebylo nalezeno",
            description:
                "Zatím jste nikoho neurčili svým zástupcem a nikdo neurčil zástupcem vás.",
            all: "Zatím nemáte žádné zastoupení. Nové určíte tlačítkem nahoře, dokud hlasování nezačne.",
            filtered: "Pro vybrané hlasování nebylo nalezeno žádné zastoupení.",
            search: "Vašemu hledání neodpovídá žádné zastoupení.",
        },
        create: {
            button: "Určit zástupce",
            noVotes: "Nyní nemáte hlasování, ke kterému lze určit zástupce",
        },
        filter: {
            vote: "Filtrovat podle hlasování",
            allVotes: "Všechna naplánovaná hlasování",
        },
        footnote: "Zastoupení může za vlastníka zaznamenat i výbor.",
        admin: {
            title: "Zaevidovat zastoupení",
            description:
                "Jako administrátor můžete zaevidovat zastoupení na základě fyzického dokumentu doloženého vlastníkem.",
            selectVote: "Vyberte hlasování",
            selectUnit: "Vyberte jednotku",
            selectOwner: "Vlastník",
            selectDelegate: "Zástupce",
            success: "Zastoupení bylo úspěšně zaevidováno",
            errors: {
                vote: "Vyberte hlasování",
                unit: "Vyberte jednotku",
                owner: "Vyberte vlastníka",
                delegate: "Vyberte zástupce",
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
        confirmSubmit: {
            title: "Odeslat hlas?",
            description_one:
                "Odešlete hlas za {{count}} jednotku. Odeslaný hlas už nelze změnit.",
            description_few:
                "Odešlete hlasy za {{count}} jednotky. Odeslané hlasy už nelze změnit.",
            description_other:
                "Odešlete hlasy za {{count}} jednotek. Odeslané hlasy už nelze změnit.",
            confirm: "Odeslat hlas",
            confirming: "Odesílám…",
        },
        success: {
            title: "Hlas byl zaznamenán",
            subtitle:
                "Váš hlas byl uložen. Průběh můžete sledovat v detailu hlasování.",
            timestamp: "Čas zaznamenání",
        },
        alreadyVoted: {
            title: "V tomto hlasování jste již hlasovali",
            description:
                "Váš hlas je zaznamenán. Průběh můžete sledovat v detailu hlasování.",
        },
        noUnits: {
            title: "Žádné jednotky k hlasování",
            description:
                "V tomto hlasování nemáte žádné další jednotky, za které by bylo možné odevzdat hlas.",
        },
        backToDetail: "Zpět na detail hlasování",
    },
    paperBallot: {
        exit: "Zavřít",
        headerTitle: "Zaznamenat listinný hlas",
        headerSubtitle:
            "Za vlastníka, z podepsaného listinného hlasovacího lístku",
        closesOn: "končí {{date}}",
        railTitle: "Zaznamenání ve 4 krocích",
        railNote:
            "Závazným dokumentem zůstává podepsaný listinný hlas. Sem přiložte sken a originál založte k dokumentům společenství.",
        steps: {
            unit: "Výběr jednotky",
            ballot: "Lístek a podpis",
            answers: "Zadání odpovědí",
            review: "Kontrola a zápis",
        },
        back: "Zpět",
        chooseUnit: {
            title: "Čí hlas zaznamenáváte?",
            subtitle:
                "Listinný hlas lze zaznamenat jen u jednotek, které dosud nehlasovaly. Dokud hlas nezaznamenáte, může vlastník hlasovat v aplikaci.",
            turnout: "Hlasovalo {{voted}} z {{total}} jednotek",
            searchPlaceholder: "Hledat jednotku nebo vlastníka…",
            columns: {
                unit: "Jednotka",
                share: "Podíl na společných částech",
                status: "Stav",
                action: "Akce",
            },
            status: {
                votedInApp: "V aplikaci · {{date}}",
                votedOnPaper: "Listinně · {{date}}",
                voted: "Hlasováno",
                notVoted: "Nehlasováno",
                ineligible: "Nemá hlas",
            },
            ineligibleReason: {
                NO_REPRESENTATIVE: "Není zvolen společný zástupce",
                MISSING_OWNERSHIP: "Není evidován vlastník",
                ASSOCIATION_OWNED: "Ve vlastnictví společenství",
            },
            record: "Zaznamenat listinný hlas",
            castInApp: "Hlasovat v aplikaci",
            range: "Zobrazeno {{from}}–{{to}} z {{total}} jednotek",
            count: "Zobrazeno {{count}} jednotek",
            empty: "Toto hlasování nemá žádné jednotky.",
            noMatch: "Vašemu hledání neodpovídá žádná jednotka.",
            footnote:
                "Zaznamenaný listinný hlas je pro jednotku konečný — vlastník už nemůže hlasovat v aplikaci. Každý zápis je vidět v historii hlasování.",
        },
        ballot: {
            title: "Přiložte lístek k jednotce {{unit}}",
            subtitle: "{{owners}} · podíl {{share}}",
            uploadLabel: "Sken hlasovacího lístku",
            dropzone: "Přetáhněte sem sken nebo vyberte soubor",
            dropzoneHint: "PDF, JPG nebo PNG · max 20 MB",
            uploading: "Nahrávání…",
            attached: "Přiloženo",
            remove: "Odebrat",
            signerLabel: "Kdo lístek podepsal?",
            ownerRole: "Vlastník · podíl {{share}}",
            representative: "Společný zástupce",
            coOwnedHint:
                "Jednotka má více spoluvlastníků — lístek by měl podepsat společný zástupce.",
            noOwners:
                "U této jednotky není evidován žádný současný vlastník, listinný hlas proto nelze zaznamenat. Zkontrolujte vlastnictví jednotky.",
            auditNote:
                "Zápis se uloží do historie jako hlas zaznamenaný za vlastníka — s vaším jménem, podepsanou osobou a přiloženým skenem. Výbor ho uvidí v historii hlasování.",
            continue: "Pokračovat k odpovědím",
            tooLarge: "Soubor je větší než 20 MB.",
            wrongType: "Přiložte PDF, JPG nebo PNG.",
        },
        answers: {
            context:
                "Přepis listinného hlasu za jednotku {{unit}} · podepsal(a) {{signer}}",
            change: "Změnit",
            progress: "Otázka {{current}} z {{total}}",
            done: "Hotovo {{percent}} %",
            caption: "Zadejte přesně to, co je vyznačeno na listinném lístku.",
            next: "Další otázka",
            review: "Zkontrolovat lístek",
        },
        exitConfirm: {
            title: "Zahodit rozepsaný zápis?",
            description:
                "Přiložený sken i zadané odpovědi se zahodí. Hlas nebude zaznamenán.",
            confirm: "Zahodit",
        },
        review: {
            title: "Kontrola před zápisem",
            subtitle:
                "Ještě jednou porovnejte každou odpověď s listinným lístkem.",
            signedBy: "Podepsal(a) {{signer}}",
            warning:
                "Zaznamenaný hlas je konečný a nelze ho změnit. Pokud některá odpověď neodpovídá lístku, vraťte se a opravte ji teď.",
            confirm:
                "Ověřil(a) jsem, že odpovědi výše odpovídají podepsanému listinnému lístku jednotky {{unit}}.",
            submit: "Zaznamenat hlas jednotky {{unit}}",
        },
        done: {
            title: "Hlas jednotky {{unit}} byl zaznamenán",
            body: "Její podíl se nyní počítá do usnášeníschopnosti. V historii je hlas veden jako zaznamenaný za vlastníka — zapsal(a) {{actor}}, podepsal(a) {{signer}}.",
            recordedAt: "Zaznamenáno",
            another: "Zaznamenat další",
            backToVote: "Zpět na hlasování",
        },
        alreadyCast: "Tato jednotka už hlasovala — nic nebylo zaznamenáno.",
        boardTools: {
            title: "Nástroje výboru",
            prompt: "Zapište hlas, který vlastník odevzdal na papíře.",
            action: "Zaznamenat listinný hlas",
        },
    },
    liveResults: {
        back: "Hlasování · {{title}}",
        title: "Průběžné výsledky",
        subtitle:
            "Hlasování je otevřené do {{date}} · přehled se průběžně doplňuje",
        roleChip: {
            board: "Pohled výboru · úplné údaje",
            owner: "Pohled vlastníka · pouze účast",
        },
        turnout: {
            caption: "podílů hlasovalo",
            captionUnits: "jednotek hlasovalo",
            headline: "Hlasovalo {{voted}} z {{total}} jednotek",
            quorumReached: "Usnášeníschopnost splněna",
            quorumNotReached: "Usnášeníschopnost zatím nesplněna",
            marker: "{{threshold}} % · kvórum",
            excluded_one:
                "{{count}} jednotku vlastní společenství, do celku se nepočítá.",
            excluded_few:
                "{{count}} jednotky vlastní společenství, do celku se nepočítají.",
            excluded_other:
                "{{count}} jednotek vlastní společenství, do celku se nepočítají.",
        },
        tally: {
            title: "Průběžný součet",
            note: "Pouze pro výbor · předběžné do uzavření",
            empty: "Zatím nikdo nehlasoval.",
            units_one: "{{count}} jednotka",
            units_few: "{{count}} jednotky",
            units_other: "{{count}} jednotek",
        },
        note: {
            board: "Jednotlivé hlasy vidíte jako člen výboru. Vlastníci vidí pouze to, zda jednotka hlasovala.",
            owner: "Jak která jednotka hlasovala zůstává skryté až do uzavření hlasování {{date}}. Do té doby vidíte pouze to, zda jednotka svůj hlas odevzdala.",
        },
        filters: { all: "Vše", voted: "Hlasovalo", notVoted: "Nehlasovalo" },
        searchPlaceholder: {
            board: "Hledat jednotku nebo vlastníka…",
            owner: "Hledat jednotku…",
        },
        columns: {
            unit: "Jednotka",
            share: "Podíl na společných částech",
            status: "Stav",
        },
        status: {
            voted: "Hlasovalo",
            notVoted: "Nehlasovalo",
            needsDelegation: "Chybí společný zástupce",
            ineligible: "Nemůže hlasovat",
            inApp: "V aplikaci · {{date}}",
            onPaper: "Listinně · {{date}}",
            onPaperRecordedBy: "Listinně · {{date}} · zapsal(a) {{name}}",
            ineligibleReason: {
                MISSING_OWNERSHIP: "Bez evidovaného vlastníka",
                ASSOCIATION_OWNED: "Ve vlastnictví společenství",
                NO_REPRESENTATIVE: "Bez společného zástupce",
            },
        },
        pill: { yours: "Vaše", proxy: "V zastoupení" },
        answers: {
            none: "—",
            expand: "Zobrazit odpovědi jednotky {{unitNo}}",
            collapse: "Skrýt odpovědi jednotky {{unitNo}}",
        },
        showing: "Zobrazeno {{shown}} z {{total}} jednotek",
        empty: "K tomuto hlasování nejsou žádné jednotky.",
        noMatch: "Hledání neodpovídá žádná jednotka.",
        entry: {
            title: "Průběžné výsledky",
            copy: "Zatím hlasovalo {{voted}} z {{total}} jednotek.",
            copyQuorum:
                "Zatím hlasovalo {{voted}} z {{total}} jednotek — usnášeníschopnost je splněna.",
            copyQuorumNotReached:
                "Zatím hlasovalo {{voted}} z {{total}} jednotek — usnášeníschopnost zatím není splněna.",
            action: "Zobrazit, kdo hlasoval",
        },
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
