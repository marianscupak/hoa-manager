import { useTranslation } from "react-i18next";

import { formatPeriodDate } from "@/components/ownership-history/rows";

import { blockerVars } from "./blocker-vars";
import { translateCoded, type Translate } from "./errors";
import type { KatastrCoded } from "./messages";

/**
 * `blockerVars` reduces a date field to a stable `YYYY-MM-DD` so it stays
 * testable without a locale; this is where that becomes the localized
 * date the rest of the app shows, following the same `formatPeriodDate`
 * the ownership-history views already use for a period boundary.
 */
function displayVars(blocker: KatastrCoded): Record<string, string> {
    const vars = blockerVars(blocker);
    // No trailing "Z": a bare "YYYY-MM-DDT00:00:00" parses as local
    // midnight, so this always prints the same calendar day `blockerVars`
    // produced. Re-adding "Z" here would parse as UTC midnight and could
    // print the previous day west of UTC — silently sending the admin to a
    // date that still trips the same blocker.
    return typeof vars.earliestAllowed === "string"
        ? {
              ...vars,
              earliestAllowed: formatPeriodDate(
                  `${vars.earliestAllowed}T00:00:00`,
              ),
          }
        : vars;
}

export function Blockers({ blockers }: { blockers: KatastrCoded[] }) {
    const { t } = useTranslation("katastr");
    if (blockers.length === 0) return null;

    // `Blockers` is reused for the apply-time 422 (Task 10's
    // `ApplyErrorNotice`), whose codes come from `validateOwnershipPlan`'s
    // defense-in-depth re-check — a different set than the five
    // import-level `KATASTR_BLOCKER_CODES` this component was first built
    // for. `translateCoded` falls back to the generic sentence for any
    // code with no catalogue entry, so a code from that re-check never
    // reaches the admin as a raw i18next key, matching the standing rule
    // that nothing on this page prints a bare code.
    const translate = t as unknown as Translate;

    return (
        <section className="border-destructive/40 bg-destructive/5 rounded-md border p-4">
            <h2 className="text-destructive font-medium">
                {t("blockers.heading")}
            </h2>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-sm">
                {blockers.map((blocker, i) => (
                    <li key={`${blocker.code}-${i}`}>
                        {translateCoded(
                            translate,
                            "blockers",
                            blocker.code,
                            displayVars(blocker),
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
