// eslint-disable-next-line import-x/no-named-as-default
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import csAdmin from "./locales/cs/admin";
import csAuth from "./locales/cs/auth";
import csCommon from "./locales/cs/common";
import csHome from "./locales/cs/home";
import csInvite from "./locales/cs/invite";
import csNotFound from "./locales/cs/not-found";
import enAdmin from "./locales/en/admin";
import enAuth from "./locales/en/auth";
import enCommon from "./locales/en/common";
import enHome from "./locales/en/home";
import enInvite from "./locales/en/invite";
import enNotFound from "./locales/en/not-found";

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
        },
        cs: {
            "home": csHome,
            "not-found": csNotFound,
            "common": csCommon,
            "auth": csAuth,
            "admin": csAdmin,
            "invite": csInvite,
        },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
