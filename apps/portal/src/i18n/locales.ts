export const locales = [
    { tag: "en", label: "English", flag: "🇺🇸" },
    { tag: "cs", label: "Čeština", flag: "🇨🇿" },
] as const;

export type LocaleTag = (typeof locales)[number]["tag"];
