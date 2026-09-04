import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ConsentRisk } from "../../utils/delegation-eligibility";

/**
 * Warns about what a consent does to the unit before it is recorded. Shown in
 * both the summary rail and the confirmation dialog, so the member meets it
 * while still choosing rather than only at the point of committing.
 */
export const ConsentRiskNotice = ({ risk }: { risk: ConsentRisk | null }) => {
    const { t } = useTranslation("voting");

    if (!risk) return null;

    return (
        <div className="rounded-panel border-warning-tint-border bg-warning-muted flex gap-3 border p-4">
            <AlertTriangle className="text-warning-deep mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
                <p className="text-warning-deep text-sm leading-[19px] font-semibold">
                    {t(`delegate.risk.${risk}.title`)}
                </p>
                <p className="text-warning-deep/90 text-sm leading-[19px]">
                    {t(`delegate.risk.${risk}.description`)}
                </p>
            </div>
        </div>
    );
};
