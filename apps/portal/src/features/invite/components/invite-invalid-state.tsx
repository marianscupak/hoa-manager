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
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-4xl">{STATUS_EMOJI[status]}</div>
            <h1 className="text-xl font-bold text-slate-900">
                {t(STATUS_I18N_KEY[status]!)}
            </h1>
            {emailMasked && (
                <p className="mt-2 text-sm text-slate-500">
                    {t("status.emailHint", { email: emailMasked })}
                </p>
            )}
            <div className="mt-6">
                <Link
                    to="/"
                    className="text-sm font-medium text-slate-900 underline"
                >
                    {t("actions.goToDashboard")}
                </Link>
            </div>
        </div>
    );
}
