import { Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@hoa-mngr/ui";

import { locales } from "@/i18n/locales";

export function UserMenuLocaleGroup() {
    const { t, i18n } = useTranslation(["common"]);

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
                    onClick={() => i18n.changeLanguage(locale.tag)}
                    className="cursor-pointer"
                >
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
