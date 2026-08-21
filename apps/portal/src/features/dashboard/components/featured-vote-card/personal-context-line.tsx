import { useTranslation } from "react-i18next";

import type { VoterStatusResponseDto } from "@/api/generated/model";

interface PersonalContextLineProps {
    voterStatus: VoterStatusResponseDto;
}

export function PersonalContextLine({ voterStatus }: PersonalContextLineProps) {
    const { t } = useTranslation("dashboard");
    const units = voterStatus.owningUnits ?? [];

    // Priority order — first match wins (per spec §6.1).
    // 1. Outstanding action — any unit READY or REQUIRES_DELEGATION.
    if (
        units.some(
            (u) => u.status === "READY" || u.status === "REQUIRES_DELEGATION",
        )
    ) {
        return (
            <p className="text-secondary-foreground mt-1 text-sm">
                {t("featuredVote.personalUncast")}
            </p>
        );
    }

    // 2. Any unit VOTED.
    if (units.some((u) => u.status === "VOTED")) {
        return (
            <p className="text-secondary-foreground mt-1 text-sm">
                {t("featuredVote.personalCast")}
            </p>
        );
    }

    // 3. Any unit DELEGATED. The current OwningUnitStatusDto does not carry
    // the delegate identity, so render a generic confirmation rather than
    // fabricating a name. See plan §8.3 — wording is implementer's call.
    if (units.some((u) => u.status === "DELEGATED")) {
        return (
            <p className="text-secondary-foreground mt-1 text-sm">
                {t("featuredVote.personalDelegated")}
            </p>
        );
    }

    // 4. All ineligible or no owning units → no line.
    return null;
}
