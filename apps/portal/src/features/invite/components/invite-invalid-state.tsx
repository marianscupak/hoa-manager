import { CheckCircle2, Clock, LucideIcon, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface InviteInvalidStateProps {
    status: "expired" | "accepted" | "not_found";
    emailMasked?: string;
}

const STATUS_ICON: Record<string, { icon: LucideIcon; className: string }> = {
    expired: { icon: Clock, className: "text-warning" },
    accepted: { icon: CheckCircle2, className: "text-success" },
    not_found: { icon: XCircle, className: "text-destructive" },
};

const STATUS_I18N_KEY = {
    expired: "status.expired",
    accepted: "status.accepted",
    not_found: "status.notFound",
} as const satisfies Record<string, string>;

export function InviteInvalidState({
    status,
    emailMasked,
}: InviteInvalidStateProps) {
    const { t } = useTranslation(["invite"]);
    const { icon: StatusIcon, className: iconClass } = STATUS_ICON[status];

    return (
        <div className="bg-card w-full max-w-md rounded-xl border p-8 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
                <StatusIcon className={`h-12 w-12 ${iconClass}`} />
            </div>
            <h1 className="text-foreground text-xl font-bold">
                {t(STATUS_I18N_KEY[status]!)}
            </h1>
            {emailMasked && (
                <p className="text-muted-foreground mt-2 text-sm">
                    {t("status.emailHint", { email: emailMasked })}
                </p>
            )}
            <div className="mt-6">
                <Link
                    to="/"
                    className="text-foreground text-sm font-medium underline"
                >
                    {t("actions.goToDashboard")}
                </Link>
            </div>
        </div>
    );
}
