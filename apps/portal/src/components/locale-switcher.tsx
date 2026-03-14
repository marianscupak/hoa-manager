import { useTranslation } from "react-i18next";

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@hoa-mngr/ui";

import { useChangeLanguage } from "../hooks/use-change-language";
import { locales } from "../i18n/locales";

export function LocaleSwitcher() {
    const { i18n } = useTranslation();
    const { changeLanguage } = useChangeLanguage();

    const currentLocale =
        locales.find((l) => l.tag === i18n.language) || locales[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <span className="mr-2">{currentLocale.flag}</span>
                    {currentLocale.label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale.tag}
                        onClick={() => changeLanguage(locale.tag)}
                        className="cursor-pointer"
                    >
                        <span className="mr-2">{locale.flag}</span>
                        {locale.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
