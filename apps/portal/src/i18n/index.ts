// eslint-disable-next-line import/no-named-as-default, import/no-named-as-default-member
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import csHome from "./locales/cs/home";
import csNotFound from "./locales/cs/not-found";
import enHome from "./locales/en/home";
import enNotFound from "./locales/en/not-found";

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
