// eslint-disable-next-line import-x/no-named-as-default
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import csAdmin from "./locales/cs/admin";
import csAuth from "./locales/cs/auth";
import csHome from "./locales/cs/home";
import csNotFound from "./locales/cs/not-found";
import enAdmin from "./locales/en/admin";
import enAuth from "./locales/en/auth";
import enHome from "./locales/en/home";
import enNotFound from "./locales/en/not-found";

declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "home";
        resources: {
            "home": typeof enHome;
            "not-found": typeof enNotFound;
            "common": typeof enHome; // Mock fallback for common type until translation object exists
            "auth": typeof enAuth;
            "admin": typeof enAdmin;
        };
    }
}

i18n.use(initReactI18next).init({
    resources: {
        en: {
            "home": enHome,
            "not-found": enNotFound,
            "auth": enAuth,
            "admin": enAdmin,
        },
        cs: {
            "home": csHome,
            "not-found": csNotFound,
            "auth": csAuth,
            "admin": csAdmin,
        },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
