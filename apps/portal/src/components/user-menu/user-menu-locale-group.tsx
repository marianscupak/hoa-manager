import { Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@hoa-mngr/ui";

import { useChangeLanguage } from "../../hooks/use-change-language";
import { locales } from "../../i18n/locales";

export function UserMenuLocaleGroup() {
    const { t, i18n } = useTranslation(["common"]);
    const { changeLanguage } = useChangeLanguage();

    return (
        <>
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    {t("common:language")}
                </div>
            </DropdownMenuLabel>
            {locales.map((locale) => (
                <DropdownMenuItem
                    key={locale.tag}
                    onClick={() => changeLanguage(locale.tag)}
                    className="cursor-pointer"
                >
                    <span className="mr-2">{locale.flag}</span>
                    <span>{locale.label}</span>
                    {i18n.language === locale.tag && (
                        <Check className="ml-auto h-4 w-4 shrink-0" />
                    )}
                </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
        </>
    );
}
