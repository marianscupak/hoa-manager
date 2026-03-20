import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@hoa-mngr/ui";

export function DelegationHelpModal() {
    const { t } = useTranslation(["voting"]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus:outline-none">
                    <Info className="h-4 w-4" />
                    <span>{t("voting:delegations.help.title")}</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("voting:delegations.help.title")}</DialogTitle>
                    <DialogDescription>
                        {t("voting:delegations.help.description")}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
                        {(
                            t("voting:delegations.help.rules", {
                                returnObjects: true,
                            }) as string[]
                        ).map((rule, index) => (
                            <li key={index}>{rule}</li>
                        ))}
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    );
}
