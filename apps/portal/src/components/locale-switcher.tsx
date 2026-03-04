import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@hoa-mngr/ui";

import { locales } from "@/i18n/locales";

export function LocaleSwitcher() {
    const { i18n } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Globe className="mr-2 h-4 w-4" />
                    {i18n.language.toUpperCase()}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale.tag}
                        onClick={() => i18n.changeLanguage(locale.tag)}
                        className="cursor-pointer"
                    >
                        {locale.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
