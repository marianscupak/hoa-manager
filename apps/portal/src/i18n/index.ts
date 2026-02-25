import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import csHome from "./locales/cs/home";
import csNotFound from "./locales/cs/not-found";
import enHome from "./locales/en/home";
import enNotFound from "./locales/en/not-found";

declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "home";
        resources: {
            "home": typeof enHome;
            "not-found": typeof enNotFound;
            "common": typeof enHome; // Mock fallback for common type until translation object exists
        };
    }
}

i18n.use(initReactI18next).init({
    resources: {
        en: { "home": enHome, "not-found": enNotFound },
        cs: { "home": csHome, "not-found": csNotFound },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
