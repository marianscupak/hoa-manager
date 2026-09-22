import type { VoteParticipationUnitDto } from "@/api/generated/model";

export interface SignerOption {
    ownerId: string;
    displayName: string;
    /** Share of the unit, null for a representative who owns none of it. */
    share: string | null;
    isRepresentative: boolean;
    isUnitOwner: boolean;
}

/**
 * Who may have signed the paper ballot: the unit's owners, plus the
 * designated representative when they own no share of it (an outsider with
 * a power of attorney). A delegate who exists only as a membership votes in
 * the app and is not offered — a paper ballot needs a person from the
 * ownership register.
 */
export function signerOptions(
    unit: Pick<VoteParticipationUnitDto, "owners" | "representative">,
): SignerOption[] {
    const options: SignerOption[] = (unit.owners ?? []).map((o) => ({
        ownerId: o.ownerId,
        displayName: o.displayName,
        share: o.share,
        isRepresentative: o.isRepresentative,
        isUnitOwner: true,
    }));
    const rep = unit.representative;
    if (rep?.ownerId && !options.some((o) => o.ownerId === rep.ownerId)) {
        options.push({
            ownerId: rep.ownerId,
            displayName: rep.name,
            share: null,
            isRepresentative: true,
            isUnitOwner: false,
        });
    }
    return options;
}

export function defaultSignerOwnerId(options: SignerOption[]): string | null {
    return options.find((o) => o.isRepresentative)?.ownerId ?? null;
}
