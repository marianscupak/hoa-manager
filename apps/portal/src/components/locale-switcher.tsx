import { useTranslation } from "react-i18next";

const locales = ["en", "cs"] as const;

export function LocaleSwitcher() {
    const { i18n } = useTranslation();

    return (
        <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="border-border bg-background text-foreground rounded-md border px-2 py-1 text-sm"
        >
            {locales.map((tag) => (
                <option key={tag} value={tag}>
                    {tag.toUpperCase()}
                </option>
            ))}
        </select>
    );
}
