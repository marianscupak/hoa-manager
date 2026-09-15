export default {
    title: "Import z katastru nemovitostí",
    intro: "Nahrajte výpis z katastru nemovitostí ve formátu XML za celou budovu. Údaje o jednotkách, podílech a vlastnících se z něj přenesou do evidence. E-mailové adresy katastr neobsahuje, ty doplníte potom.",
    pickFile: "Vybrat soubor",
    dropzone: {
        label: "Přetáhněte sem výpis nebo vyberte soubor",
        hint: "Soubor XML · max 8 MB",
        rejected: {
            type: "Nahrajte prosím jeden soubor ve formátu XML.",
            size: "Soubor je větší než 8 MB.",
        },
    },
    analyze: "Zobrazit náhled",
    confirm: "Potvrdit import",
    cancel: "Zrušit",
    adminOnly: "Import z katastru nemovitostí může spustit jen administrátor.",
    document: {
        heading: "Soubor",
        lv: "List vlastnictví",
        municipality: "Obec",
        area: "Katastrální území",
        validAt: "Data platná k",
        issuedAt: "Soubor vyhotoven",
    },
    effectiveAt: {
        label: "Změny vlastnictví nabudou účinnosti",
        hint: "Předvyplněno datem, ke kterému jsou data v katastru platná.",
    },
    counts: {
        unitsCreated: "{{count}} jednotek k založení",
        unitsUpdated: "{{count}} jednotek ke změně",
        unitsUnchanged: "{{count}} jednotek bez změny",
        ownersCreated: "{{count}} nových vlastníků",
        ownersMatched: "{{count}} spárovaných vlastníků",
        nothingToDo: "Soubor neobsahuje nic, co by se mělo změnit.",
    },
    table: {
        unit: "Jednotka",
        change: "Změna",
        create: "Založit",
        update: "Změnit",
        unchanged: "Bez změny",
        notInFile: "Není v souboru",
        notInFileHint: "Zůstane v evidenci, import nic nemaže.",
        shareChange: "Podíl {{from}} → {{to}}",
        unitNoChange: "Označení {{from}} → {{to}}",
        usageChange: "Využití {{from}} → {{to}}",
        ownershipChange: "Vlastnictví: {{from}} → {{to}}",
        newOwnership: "Vlastnictví: {{to}}",
        count_one: "{{count}} řádek",
        count_few: "{{count}} řádky",
        count_other: "{{count}} řádků",
    },
    owners: {
        heading: "Vlastníci",
        byKatastrId: "Spárováno podle katastrálního ID",
        byIco: "Spárováno podle IČO",
        byName: "Spárováno podle jména",
        create: "Nový vlastník",
        noEmail: "bez e-mailu",
        hasAccount: "má účet",
        checkNameMatches:
            "Párování podle jména zkontrolujte. Nesouhlasí-li, import zrušte a jména v evidenci upravte.",
    },
    warnings: {
        heading: "Upozornění",
        IMPLIED_FULL_SHARE:
            "U jednotky {{unitNo}} nebyl v souboru uveden podíl, bere se jako 1/1.",
        NAME_MATCH:
            "„{{fileName}}“ ze souboru se spáruje s „{{registerName}}“ v evidenci.",
        KIND_MISMATCH:
            "Evidence vede tohoto vlastníka jako jiný druh, než uvádí katastr. Druh se nezmění, upravte ho ručně, pokud je potřeba.",
    },
    blockers: {
        heading: "Import nelze provést",
        EFFECTIVE_DATE_TOO_EARLY:
            "Jednotku {{unitNo}} nelze změnit k tomuto datu, její poslední vlastnické období začíná {{earliestAllowed}}. Zvolte toto nebo pozdější datum.",
        TRANSFER_ALREADY_SCHEDULED:
            "U jednotky {{unitNo}} je už naplánovaná změna vlastnictví. Zrušte ji, nebo počkejte, než nabude účinnosti.",
        AMBIGUOUS_NAME:
            "Jméno „{{name}}“ nelze spárovat jednoznačně — v evidenci mu odpovídá víc než jeden záznam. Odlište je, nebo jeden smažte.",
        AMBIGUOUS_ICO:
            "IČO „{{ico}}“ nelze spárovat jednoznačně — v evidenci mu odpovídá víc než jeden záznam. Odlište je, nebo jeden smažte.",
        MIXED_ASSOCIATION:
            "Jednotku {{unitNo}} vlastní podle souboru víc stran a jednou z nich je „{{ownerName}}“, kterého evidence vede jako společenství. To systém neumí; změňte druh vlastníka.",
        UNIT_NO_COLLISION:
            "Označení jednotky {{unitNo}} už v evidenci patří jiné jednotce. Přejmenujte ji, nebo označení upravte.",
        OWNERSHIP_PLAN_REJECTED:
            "Jednotku {{unitNo}} nelze naimportovat kvůli internímu ověření vlastnictví ({{reason}}). Ozvěte se nám, ať se na to podíváme.",
    },
    errors: {
        heading: "Soubor nelze zpracovat",
        NOT_A_KATASTR_DOCUMENT: "Tohle není výpis z katastru nemovitostí.",
        UNSUPPORTED_DIALECT:
            "Tento výpis obsahuje informace o jednotkách, ale ne podíly a vlastníky. Objednejte v katastru výpis z listu vlastnictví za celou budovu.",
        DTD_NOT_ALLOWED:
            "Soubor obsahuje deklaraci DTD a z bezpečnostních důvodů se nezpracovává.",
        MALFORMED_XML: "Soubor není platné XML.",
        // The one genuinely different member of this family: it asks the
        // chair to contact us, not to order a new extract, so it keeps its
        // own ending rather than the shared closing sentence below.
        UNKNOWN_SUBJECT_TYPE:
            "U jednotky {{unitNo}} je vlastník vedený jako druh, který systém nezná. Ozvěte se nám, ať ho doplníme.",
        PARTIAL_EXTRACT:
            "Jde o částečný výpis, ze kterého nelze spočítat podíly. Objednejte úplný výpis.",
        // SHARE_MALFORMED, INCONSISTENT_DUPLICATE_UNIT, SUBJECT_WITHOUT_ID
        // and SUBJECT_WITHOUT_TYPE all resolve to "order the extract
        // again" — one shared closing sentence, so the opening clause is
        // the only thing that carries the distinction between them.
        INCONSISTENT_DUPLICATE_UNIT:
            "Jedna jednotka je v souboru uvedena dvakrát a pokaždé jinak. Objednejte si nový výpis z katastru.",
        SHARE_OUT_OF_RANGE:
            "Podíl {{value}} u jednotky {{unitNo}} je pro systém příliš velký. Nic se nezaokrouhluje, import se neprovede.",
        SHARE_MALFORMED:
            "Podíl u jednotky {{unitNo}} není platný zlomek. Objednejte si nový výpis z katastru.",
        BUILDING_SHARE_SUM:
            "Součet podílů jednotek v souboru není 1/1, ale {{actual}}. Soubor pravděpodobně obsahuje jednotky dvakrát.",
        UNIT_SHARE_SUM:
            "Součet podílů vlastníků u jednotky {{unitNo}} není 1/1, ale {{actual}}.",
        SJM_SHAPE_UNEXPECTED:
            "U jednotky {{unitNo}} má společné jmění manželů neočekávaný tvar.",
        UNIT_WITHOUT_OWNER:
            "Jednotka {{unitNo}} nemá v souboru žádného vlastníka.",
        SUBJECT_WITHOUT_ID:
            "U jednotky {{unitNo}} chybí u vlastníka identifikátor. Objednejte si nový výpis z katastru.",
        SUBJECT_WITHOUT_TYPE:
            "U jednotky {{unitNo}} chybí u vlastníka druh subjektu. Objednejte si nový výpis z katastru.",
        MISSING_DOCUMENT_DATE:
            "Soubor neobsahuje datum, ke kterému jsou data platná, nebo kdy byl vyhotoven. Objednejte si nový výpis z katastru.",
        FILE_REQUIRED: "Vyberte soubor, který se má naimportovat.",
        FILE_TOO_LARGE: "Soubor je větší než 8 MB.",
        UNEXPECTED_FILE: "Nahrajte prosím jeden soubor ve formátu XML.",
        STALE: "Evidence se od zobrazení náhledu změnila. Zkontrolujte nový náhled a potvrďte znovu.",
    },
    done: {
        heading: "Import proběhl",
        summary:
            "Založeno {{created}} jednotek, změněno {{updated}}. Doplňte vlastníkům e-maily a pozvěte je do portálu.",
        backToUnits: "Zpět na jednotky",
    },
} as const;
