export default {
    title: "Cadastre import",
    intro: "Upload an XML extract from the Land Registry (katastr nemovitostí) for the whole building. Unit, share and owner data will be transferred into the register from it. The extract does not contain email addresses — add those afterwards.",
    pickFile: "Choose file",
    dropzone: {
        label: "Drop the extract here or browse",
        hint: "XML file · max 8 MB",
        rejected: {
            type: "Please upload a single XML file.",
            size: "The file is larger than 8 MB.",
        },
    },
    analyze: "Show preview",
    confirm: "Confirm import",
    cancel: "Cancel",
    adminOnly: "Only an administrator can import from the cadastre.",
    document: {
        heading: "File",
        lv: "Certificate of ownership (LV)",
        municipality: "Municipality",
        area: "Cadastral area",
        validAt: "Data valid as of",
        issuedAt: "File issued",
    },
    effectiveAt: {
        label: "Ownership changes take effect",
        hint: "Pre-filled with the date the cadastre data is valid as of.",
    },
    counts: {
        unitsCreated: "{{count}} units to create",
        unitsUpdated: "{{count}} units to update",
        unitsUnchanged: "{{count}} units unchanged",
        ownersCreated: "{{count}} new owners",
        ownersMatched: "{{count}} matched owners",
        nothingToDo: "The file contains nothing that needs to change.",
    },
    table: {
        unit: "Unit",
        change: "Change",
        create: "Create",
        update: "Update",
        unchanged: "Unchanged",
        notInFile: "Not in file",
        notInFileHint: "Stays in the register — import deletes nothing.",
        shareChange: "Share {{from}} → {{to}}",
        unitNoChange: "Label {{from}} → {{to}}",
        usageChange: "Usage {{from}} → {{to}}",
        ownershipChange: "Ownership: {{from}} → {{to}}",
        newOwnership: "Ownership: {{to}}",
        count_one: "{{count}} row",
        count_other: "{{count}} rows",
    },
    owners: {
        heading: "Owners",
        byKatastrId: "Matched by cadastre ID",
        byIco: "Matched by company ID (IČO)",
        byName: "Matched by name",
        create: "New owner",
        noEmail: "no email",
        hasAccount: "has an account",
        checkNameMatches:
            "Check the name-based matches. If any is wrong, cancel the import and fix the names in the register.",
    },
    warnings: {
        heading: "Warnings",
        IMPLIED_FULL_SHARE:
            "Unit {{unitNo}} had no share stated in the file; it is treated as 1/1.",
        NAME_MATCH:
            '"{{fileName}}" from the file will be matched to "{{registerName}}" in the register.',
        KIND_MISMATCH:
            "The register lists this owner as a different kind than the cadastre states. The kind will not change; edit it manually if needed.",
    },
    blockers: {
        heading: "Import cannot proceed",
        EFFECTIVE_DATE_TOO_EARLY:
            "Unit {{unitNo}} cannot be changed on this date — its latest ownership period starts {{earliestAllowed}}. Choose this date or a later one.",
        TRANSFER_ALREADY_SCHEDULED:
            "Unit {{unitNo}} already has a scheduled ownership change. Cancel it, or wait until it takes effect.",
        AMBIGUOUS_NAME:
            'The name "{{name}}" cannot be matched unambiguously — more than one record in the register matches it. Tell them apart, or delete one.',
        AMBIGUOUS_ICO:
            'The company ID (IČO) "{{ico}}" cannot be matched unambiguously — more than one record in the register matches it. Tell them apart, or delete one.',
        MIXED_ASSOCIATION:
            'According to the file, unit {{unitNo}} is owned by more than one party, and one of them, "{{ownerName}}", is listed in the register as an association. The system cannot handle that; change that owner\'s kind.',
        UNIT_NO_COLLISION:
            "The label {{unitNo}} already belongs to a different unit in the register. Rename that unit, or change this label.",
        OWNERSHIP_PLAN_REJECTED:
            "Unit {{unitNo}} could not be imported because of an internal ownership check ({{reason}}). Contact us so we can look into it.",
    },
    errors: {
        heading: "The file could not be processed",
        NOT_A_KATASTR_DOCUMENT:
            "This is not a Land Registry (katastr nemovitostí) extract.",
        UNSUPPORTED_DIALECT:
            "This extract contains unit information but not shares and owners. Order a certificate-of-ownership extract for the whole building from the cadastre.",
        DTD_NOT_ALLOWED:
            "The file contains a DTD declaration and is not processed for security reasons.",
        MALFORMED_XML: "The file is not valid XML.",
        // The one genuinely different member of this family: it asks the
        // chair to contact us, not to order a new extract, so it keeps its
        // own ending rather than the shared closing sentence below.
        UNKNOWN_SUBJECT_TYPE:
            "Unit {{unitNo}} has an owner listed as a kind the system does not recognize. Let us know so we can add it.",
        PARTIAL_EXTRACT:
            "This is a partial extract, so shares cannot be computed from it. Order a full extract.",
        // SHARE_MALFORMED, INCONSISTENT_DUPLICATE_UNIT, SUBJECT_WITHOUT_ID
        // and SUBJECT_WITHOUT_TYPE all resolve to "order the extract
        // again" — one shared closing sentence, so the opening clause is
        // the only thing that carries the distinction between them.
        INCONSISTENT_DUPLICATE_UNIT:
            "One unit appears twice in the file with different data each time. Order a new extract from the cadastre.",
        SHARE_OUT_OF_RANGE:
            "The share {{value}} on unit {{unitNo}} is too large for the system. Nothing is rounded — the import will not proceed.",
        SHARE_MALFORMED:
            "The share on unit {{unitNo}} is not a valid fraction. Order a new extract from the cadastre.",
        BUILDING_SHARE_SUM:
            "The sum of unit shares in the file is not 1/1, but {{actual}}. The file likely lists units twice.",
        UNIT_SHARE_SUM:
            "The sum of owner shares on unit {{unitNo}} is not 1/1, but {{actual}}.",
        SJM_SHAPE_UNEXPECTED:
            "On unit {{unitNo}}, the marital community property (SJM) has an unexpected shape.",
        UNIT_WITHOUT_OWNER: "Unit {{unitNo}} has no owner in the file.",
        SUBJECT_WITHOUT_ID:
            "Unit {{unitNo}} has an owner with no identifier. Order a new extract from the cadastre.",
        SUBJECT_WITHOUT_TYPE:
            "Unit {{unitNo}} has an owner with no stated kind. Order a new extract from the cadastre.",
        MISSING_DOCUMENT_DATE:
            "The file has no date for when the data is valid or when it was issued. Order a new extract from the cadastre.",
        FILE_REQUIRED: "Choose a file to import.",
        FILE_TOO_LARGE: "The file is larger than 8 MB.",
        UNEXPECTED_FILE: "Please upload a single XML file.",
        STALE: "The register has changed since the preview was shown. Check the new preview and confirm again.",
    },
    done: {
        heading: "Import complete",
        summary:
            "Created {{created}} units, updated {{updated}}. Add owners' emails and invite them to the portal.",
        backToUnits: "Back to units",
    },
} as const;
