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
    INVALID_OWNERSHIP_SHARE: "Vlastnický podíl musí být kladné číslo.",
    INVALID_OWNERSHIP_SUM:
        "Součet vlastnických podílů musí být přesně 1.0 (100 %).",
    UNKNOWN: "Došlo k neočekávané chybě. Zkuste to prosím později.",
    INVALID_VOTE_SCHEDULE:
        "Harmonogram hlasování je neplatný. Ujistěte se, že datum ukončení je po datu zahájení a data nejsou v minulosti.",
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
    MEMBERSHIP_HAS_NO_ASSOCIATED_OWNER:
        "Vaše členství není správně propojeno s profilem vlastníka.",
    MUTUAL_DELEGATION_NOT_ALLOWED:
        "Vzájemné delegování není povoleno. Tato osoba na vás již svůj hlas delegovala.",
} as const;
