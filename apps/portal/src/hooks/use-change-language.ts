import { useTranslation } from "react-i18next";

import { useIdentityControllerUpdateLanguage } from "../api/generated/identity/identity";
import { LocaleTag } from "../i18n/locales";

export function useChangeLanguage() {
    const { i18n } = useTranslation();
    const updateLanguageMutation = useIdentityControllerUpdateLanguage();

    const changeLanguage = async (tag: LocaleTag) => {
        await i18n.changeLanguage(tag);
        // Persist to backend if possible (it will fail if not logged in, which is fine)
        try {
            await updateLanguageMutation.mutateAsync({
                data: { language: tag },
            });
        } catch {
            // Unauthenticated or other error, just ignore
        }
    };

    return { changeLanguage };
}
