import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface InviteInvalidStateProps {
    status: "expired" | "accepted" | "not_found";
    emailMasked?: string;
}

const STATUS_EMOJI: Record<string, string> = {
    expired: "⏰",
    accepted: "✅",
    not_found: "❌",
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

    return (
        <div className="bg-card w-full max-w-md rounded-xl border p-8 text-center shadow-sm">
            <div className="mb-4 text-4xl">{STATUS_EMOJI[status]}</div>
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
