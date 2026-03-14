import csFlag from "@/assets/flags/cs.svg";
import enFlag from "@/assets/flags/en.svg";

export const locales = [
    { tag: "en", label: "English", flag: enFlag },
    { tag: "cs", label: "Čeština", flag: csFlag },
] as const;

export type LocaleTag = (typeof locales)[number]["tag"];
