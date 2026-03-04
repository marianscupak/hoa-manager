import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button } from "@hoa-mngr/ui";

import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

interface InviteActionPickerProps {
    token: string;
    onCreateAccount: () => void;
}

export function InviteActionPicker({
    token,
    onCreateAccount,
}: InviteActionPickerProps) {
    const { t } = useTranslation(["invite"]);
    const navigate = useNavigate();

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
                <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                        StorageService.setString(
                            STORAGE_KEYS.POST_LOGIN_REDIRECT,
                            `/invites/owner?token=${token}`,
                        );
                        navigate("/login");
                    }}
                >
                    {t("actions.signIn")}
                </Button>
            </div>
        </div>
    );
}
