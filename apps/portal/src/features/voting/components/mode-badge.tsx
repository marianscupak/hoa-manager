import { useTranslation } from "react-i18next";

import { Badge } from "@hoa-mngr/ui";

export function ModeBadge({
    mode,
}: {
    mode: "PER_ROLLAM" | "ASSEMBLY_RECORD";
}) {
    const { t } = useTranslation(["voting"]);
    return (
        <Badge variant="outline" title={t(`voting:mode.${mode}.citation`)}>
            {t(`voting:mode.${mode}.label`)}
        </Badge>
    );
}
