import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "@hoa-mngr/ui";

interface InviteActionPickerProps {
    token: string;
    onCreateAccount: () => void;
}

export function InviteActionPicker({
    token,
    onCreateAccount,
}: InviteActionPickerProps) {
    const { t } = useTranslation(["invite"]);

    return (
        <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-medium text-slate-900">
                    {t("actions.createAccount")}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    {t("actions.createAccountDescription")}
                </p>
                <Button onClick={onCreateAccount} className="mt-3 w-full">
                    {t("actions.createAccount")}
                </Button>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-medium text-slate-900">
                    {t("actions.signIn")}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    {t("actions.signInDescription")}
                </p>
                <Link
                    to="/login"
                    state={{
                        from: {
                            pathname: `/invites/owner?token=${token}`,
                        },
                    }}
                >
                    <Button variant="outline" className="mt-3 w-full">
                        {t("actions.signIn")}
                    </Button>
                </Link>
            </div>
        </div>
    );
}
