import type enAuth from "./locales/en/auth";
import type enHome from "./locales/en/home";
import type enKatastr from "./locales/en/katastr";
import type enNotFound from "./locales/en/not-found";

/**
 * Augment i18next's types so that t() calls are fully type-checked.
 * - Keys are inferred from the English locale files (source of truth).
 * - Unknown keys and wrong namespaces become TypeScript errors.
 */
declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "home";
        resources: {
            "home": typeof enHome;
            "not-found": typeof enNotFound;
            "auth": typeof enAuth;
            "katastr": typeof enKatastr;
        };
    }
}
