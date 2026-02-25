import { useTranslation } from "react-i18next";

const locales = ["en", "cs"] as const;

export function LocaleSwitcher() {
    const { i18n } = useTranslation();

    return (
        <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
        >
            {locales.map((tag) => (
                <option key={tag} value={tag}>
                    {tag.toUpperCase()}
                </option>
            ))}
        </select>
    );
}
