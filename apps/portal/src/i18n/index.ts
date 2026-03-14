// eslint-disable-next-line import-x/no-named-as-default
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import csAdmin from "./locales/cs/admin";
import csAuth from "./locales/cs/auth";
import csCommon from "./locales/cs/common";
import csErrors from "./locales/cs/errors";
import csHome from "./locales/cs/home";
import csInvite from "./locales/cs/invite";
import csNotFound from "./locales/cs/not-found";
import { voting as csVoting } from "./locales/cs/voting";
import enAdmin from "./locales/en/admin";
import enAuth from "./locales/en/auth";
import enCommon from "./locales/en/common";
import enErrors from "./locales/en/errors";
import enHome from "./locales/en/home";
import enInvite from "./locales/en/invite";
import enNotFound from "./locales/en/not-found";
import { voting as enVoting } from "./locales/en/voting";

declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "home";
        resources: {
            "home": typeof enHome;
            "not-found": typeof enNotFound;
            "common": typeof enCommon;
            "auth": typeof enAuth;
            "admin": typeof enAdmin;
            "invite": typeof enInvite;
            "errors": typeof enErrors;
            "voting": typeof enVoting;
        };
    }
}

i18n.use(initReactI18next).init({
    resources: {
        en: {
            "home": enHome,
            "not-found": enNotFound,
            "common": enCommon,
            "auth": enAuth,
            "admin": enAdmin,
            "invite": enInvite,
            "errors": enErrors,
            "voting": enVoting,
        },
        cs: {
            "home": csHome,
            "not-found": csNotFound,
            "common": csCommon,
            "auth": csAuth,
            "admin": csAdmin,
            "invite": csInvite,
            "errors": csErrors,
            "voting": csVoting,
        },
    },
    lng: "cs",
    fallbackLng: "cs",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
