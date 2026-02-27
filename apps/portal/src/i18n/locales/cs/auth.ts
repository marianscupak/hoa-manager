export default {
    login: {
        error: "Přihlášení se nezdařilo. Zkontrolujte prosím své údaje.",
        invalidEmail: "Neplatná e-mailová adresa.",
        invalidPassword: "Heslo nesmí být prázdné.",
    },
    tenantSwitcher: {
        success: "Úspěšně přepnuto.",
        error: "Přepnutí se nezdařilo.",
    },
    googleCallback: {
        error: "Ověření pomocí Google se nezdařilo.",
    },
    selectTenant: {
        title: "Vyberte společenství",
        loading: "Načítám vaše společenství...",
        noCommunities: "Nebyla nalezena žádná společenství.",
        joining: "Připojování...",
        notFound: "Nevidíte své společenství?",
        createNew: "Vytvořit nové společenství",
    },
} as const;
