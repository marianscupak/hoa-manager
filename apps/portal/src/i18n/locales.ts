export const locales = [
    { tag: "en", label: "English" },
    { tag: "cs", label: "Čeština" },
] as const;

export type LocaleTag = (typeof locales)[number]["tag"];
