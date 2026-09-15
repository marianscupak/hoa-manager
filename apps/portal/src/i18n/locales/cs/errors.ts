export default {
    USER_ALREADY_EXISTS: "Uživatel s tímto e-mailem již existuje.",
    USER_NOT_FOUND: "Uživatel nenalezen.",
    INVALID_CREDENTIALS: "Nesprávný e-mail nebo heslo.",
    INVALID_TOKEN: "Vaše relace vypršela. Přihlaste se prosím znovu.",
    UNAUTHORIZED: "K provedení této akce nemáte oprávnění.",
    REPLAY_ATTACK:
        "Byl zjištěn bezpečnostní problém. Přihlaste se prosím znovu.",
    INVITE_NOT_FOUND: "Pozvánka nenalezena.",
    INVITE_EXPIRED: "Platnost pozvánky vypršela.",
    INVITE_ALREADY_ACCEPTED: "Tato pozvánka již byla přijata.",
    OWNER_ALREADY_CLAIMED:
        "Tento záznam vlastníka je již propojen s uživatelem.",
    OWNER_EMAIL_REQUIRED:
        "Pro odeslání pozvánky je vyžadována e-mailová adresa.",
    EMAIL_MISMATCH: "Váš e-mail neodpovídá e-mailu na pozvánce.",
    EMAIL_NOT_VERIFIED: "Před přijetím pozvánky prosím ověřte svůj e-mail.",
    ACCOUNT_EXISTS:
        "Účet s tímto e-mailem již existuje, ale není propojen s touto pozvánkou. Přihlaste se prosím ke svému stávajícímu účtu.",
    USER_INACTIVE:
        "Váš účet je momentálně neaktivní nebo pozastavený. Kontaktujte prosím podporu.",
    INTERNAL_SERVER_ERROR:
        "Nastala neočekávaná chyba. Zkuste to prosím později.",
    UNIT_NOT_FOUND: "Požadovaná jednotka nebyla nalezena.",
    OWNER_NOT_FOUND: "Požadovaný vlastník nebyl nalezen.",
    TENANT_NOT_FOUND: "Požadované společenství nebylo nalezeno.",
    DUPLICATE_UNIT_NUMBER:
        "Jednotka s tímto číslem v tomto společenství již existuje.",
    DUPLICATE_OWNER_EMAIL:
        "Vlastník s tímto e-mailem v tomto společenství již existuje.",
    OWNER_EMAIL_ALREADY_SET: "Tento vlastník již má e-mailovou adresu.",
    INVALID_OWNERSHIP_SHARE: "Vlastnický podíl musí být kladné číslo.",
    INVALID_OWNERSHIP_SUM:
        "Součet vlastnických podílů musí být přesně 1/1 (100 %).",
    OWNERSHIP_SJM_MEMBERS_INVALID:
        "SJM musí mít přesně dva různé vlastníky, oba fyzické osoby.",
    OWNERSHIP_MIXED_ASSOCIATION_UNSUPPORTED:
        "Vlastnictví jednotky společenstvím nelze kombinovat s dalšími vlastníky.",
    OWNERSHIP_DUPLICATE_OWNER: "Vlastník se v rozdělení podílů opakuje.",
    OWNER_ASSOCIATION_ALREADY_EXISTS:
        "Vlastník typu společenství v tomto společenství již existuje.",
    OWNERSHIP_TRANSFER_ALREADY_SCHEDULED:
        "Pro tuto jednotku je už naplánována změna vlastnictví. Nejdříve ji zrušte.",
    OWNERSHIP_EFFECTIVE_DATE_TOO_EARLY:
        "Datum nemůže předcházet začátku současného vlastnictví.",
    OWNERSHIP_NO_SCHEDULED_TRANSFER:
        "Pro tuto jednotku není naplánována žádná změna vlastnictví.",
    OWNER_HAS_OWNERSHIP_RECORDS:
        "Vlastník má záznamy o vlastnictví jednotek a nelze ho odstranit.",
    UNKNOWN: "Došlo k neočekávané chybě. Zkuste to prosím později.",
    VOTE_NOT_FOUND: "Hlasování nebylo nalezeno.",
    VOTE_NOT_DRAFT: "Hlasování již není v režimu konceptu a nelze jej měnit.",
    VOTE_RULESET_REQUIRED:
        "Před přidáním otázek musí být nastavena pravidla hlasování.",
    VOTE_QUESTION_NOT_FOUND: "Otázka nebyla nalezena.",
    INVALID_VOTE_QUESTION:
        "Neplatná otázka. Zkontrolujte prosím znění a možnosti.",
    RULESET_CHANGE_BLOCKED:
        "Pravidla hlasování již nelze měnit, protože hlasování bylo zahájeno nebo již obsahuje otázky.",
    VOTE_SCHEDULE_IN_PAST: "Naplánovaná data nemohou být v minulosti.",
    VOTE_SCHEDULE_INVALID_RANGE: "Harmonogram hlasování je neplatný.",
    INVALID_VOTE_STATUS_FOR_DELEGATION:
        "Delegování je povoleno pouze pokud je hlasování v naplánovaném stavu.",
    NOT_A_UNIT_OWNER: "Nejste vlastníkem této jednotky.",
    UNIT_NOT_ELIGIBLE: "Tato jednotka v tomto hlasování nemá hlas.",
    MEMBERSHIP_HAS_NO_ASSOCIATED_OWNER:
        "Vaše členství není správně propojeno s profilem vlastníka.",
    LAST_ADMIN_CANNOT_BE_REMOVED:
        "Posledního administrátora nelze odstranit ani mu změnit roli.",
    BALLOT_ALREADY_CAST: "V tomto hlasování jste již odevzdali svůj hlas.",
    DELEGATION_NOT_FOUND: "Požadované delegování nebylo nalezeno.",
    FORBIDDEN: "K provedení této akce nemáte dostatečná oprávnění.",
    INCOMPLETE_VOTE: "Konfigurace hlasování není úplná.",
    INVALID_BALLOT_ANSWERS: "Odevzdané odpovědi v hlasování jsou neplatné.",
    VOTE_RULESET_SUBLEGAL:
        "Zvolená pravidla hlasování jsou mírnější než povolené minimum a nelze je uložit.",
    VOTE_RULESET_ACK_REQUIRED:
        "Je nutné potvrdit, že stanovy umožňují zvolenou odchylku od zákonných pravidel.",
    VOTE_RULESET_OVERRIDE_NOT_STRICTER:
        "Přepsání pravidel pro otázku musí být přísnější než výchozí pravidla hlasování.",
    VOTE_WINDOW_TOO_SHORT_PER_ROLLAM:
        "Hlasovací okno per rollam musí trvat alespoň 15 dnů.",
    VOTE_BUILDING_SHARES_INCOMPLETE:
        "Podíly jednotek na domě nedávají dohromady 1/1 — aktuální součet {{param}}. Doplňte jednotky před otevřením hlasování.",
    MEMBERSHIP_NOT_FOUND:
        "Členství uživatele v tomto společenství nebylo nalezeno.",
    NOT_UNIT_REPRESENTATIVE: "Nejste určeným zástupcem pro tuto jednotku.",
    VOTE_MISSING_QUESTIONS: "Hlasování musí obsahovat alespoň jednu otázku.",
    VOTE_NOT_OPEN: "Toto hlasování momentálně není otevřeno.",
    VOTE_NOT_READY_TO_OPEN: "Hlasování není připraveno k otevření.",
    VOTE_NOT_SCHEDULED:
        "Hlasování musí být naplánováno, než může být otevřeno.",
    VOTE_QUESTION_MISSING_OPTIONS: "Některé otázky nemají vyplněné možnosti.",
    VOTE_SCHEDULE_MISSING_DATES:
        "V harmonogramu hlasování chybí datum zahájení nebo ukončení.",
    VOTE_DOCUMENT_NOT_FOUND: "Dokument nebyl nalezen.",
    VOTE_DOCUMENT_LIMIT_REACHED:
        "Hlasování již obsahuje maximální počet dokumentů (20).",
    VOTE_DOCUMENT_TYPE_NOT_ALLOWED: "Tento typ souboru není povolen.",
    VOTE_DOCUMENT_TOO_LARGE: "Soubor přesahuje limit 50 MB.",
    VOTE_DOCUMENT_UPLOAD_INCOMPLETE:
        "Nahrávání se nedokončilo. Zkuste to prosím znovu.",
    DOCUMENT_STORAGE_NOT_CONFIGURED: "Úložiště dokumentů není nakonfigurováno.",
    CONSENT_ALREADY_RECORDED:
        "Plná moc od tohoto vlastníka už je pro toto hlasování zaevidována. Nejprve ji odvolejte.",
} as const;
