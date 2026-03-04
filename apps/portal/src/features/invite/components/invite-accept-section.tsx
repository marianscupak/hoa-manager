import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

import { LogoutButton } from "@/components/logout-button";

interface InviteAcceptSectionProps {
    onAccept: () => void;
    isPending: boolean;
}

export function InviteAcceptSection({
    onAccept,
    isPending,
}: InviteAcceptSectionProps) {
    const { t } = useTranslation(["invite"]);

    return (
        <div className="space-y-4">
            <Button onClick={onAccept} disabled={isPending} className="w-full">
                {isPending ? t("accept.loading") : t("accept.submit")}
            </Button>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <span>{t("accept.wrongAccount")}</span>
                <LogoutButton />
            </div>
        </div>
    );
}
