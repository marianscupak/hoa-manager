export default {
    status: {
        loading: "Ověřuji pozvánku...",
        valid: "Byli jste pozváni!",
        expired: "Platnost této pozvánky vypršela.",
        accepted: "Tato pozvánka již byla použita.",
        notFound: "Pozvánka nebyla nalezena nebo je neplatná.",
        expiresAt: "Platnost do: {{date}}",
        emailHint: "Tato pozvánka je pro {{email}}",
    },
    actions: {
        acceptInvite: "Přijmout pozvánku",
        goToDashboard: "Přejít na nástěnku",
        signIn: "Přihlásit se",
        signInDescription: "Máte již účet? Přihlaste se a přijměte pozvánku.",
        createAccount: "Vytvořit účet",
        createAccountDescription: "Jste tu poprvé? Vytvořte si účet a začněte.",
    },
    register: {
        title: "Vytvořte si účet",
        description:
            "Nastavte si heslo pro vytvoření účtu a připojení ke společenství.",
        passwordLabel: "Heslo",
        passwordReveal: "Zobrazit heslo",
        passwordHide: "Skrýt heslo",
        passwordPlaceholder: "Zadejte heslo (min. 8 znaků)",
        submit: "Vytvořit účet a připojit se",
        submitting: "Vytváření účtu...",
        success: "Účet vytvořen! Přesměrování...",
        error: "Nepodařilo se vytvořit účet. Zkuste to prosím znovu.",
        accountExists:
            "Účet s tímto e-mailem již existuje. Přihlaste se prosím.",
    },
    accept: {
        submit: "Přijmout pozvánku",
        wrongAccount: "Špatný účet?",
        loading: "Přijímání pozvánky...",
        success: "Pozvánka přijata! Přesměrování...",
        error: "Nepodařilo se přijmout pozvánku.",
        emailMismatch: "Váš přihlášený e-mail neodpovídá e-mailu v pozvánce.",
        notVerified: "Nejprve prosím ověřte svou e-mailovou adresu.",
    },
} as const;
