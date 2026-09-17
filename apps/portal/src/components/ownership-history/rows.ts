import { format } from "date-fns";

import type {
    UnitOwnershipPeriodResponseDto,
    UnitOwnershipResponseDto,
} from "@/api/generated/model";

export interface OwnershipHistoryRow {
    /** The party id — unique across periods, so it doubles as the row id. */
    id: string;
    party: UnitOwnershipResponseDto;
    validFrom: string;
    validTo: string | null;
    status: UnitOwnershipPeriodResponseDto["status"];
    /**
     * True on the first row of each period. A period spans as many rows as it
     * has parties, so anything that belongs to the period rather than to one
     * party — an action on its dates, say — renders against this flag.
     */
    isPeriodStart: boolean;
}

/** One table row per party; periods arrive newest first from the API. */
export function flattenPeriods(
    periods: UnitOwnershipPeriodResponseDto[] | undefined,
): OwnershipHistoryRow[] {
    return (periods ?? []).flatMap((period) =>
        period.parties.map((party, index) => ({
            id: party.id,
            party,
            validFrom: period.validFrom,
            validTo: period.validTo,
            status: period.status,
            isPeriodStart: index === 0,
        })),
    );
}

export function findScheduledPeriod(
    periods: UnitOwnershipPeriodResponseDto[] | undefined,
): UnitOwnershipPeriodResponseDto | undefined {
    return periods?.find((p) => p.status === "SCHEDULED");
}

/** Start of the newest period — the earliest date a new change may take. */
export function latestPeriodStart(
    periods: UnitOwnershipPeriodResponseDto[] | undefined,
): Date | undefined {
    const first = periods?.[0];
    return first ? new Date(first.validFrom) : undefined;
}

export const formatPeriodDate = (iso: string): string =>
    format(new Date(iso), "d. M. yyyy");

/**
 * "od 1. 10. 2026" for an open period, "15. 3. 2020 – 1. 10. 2026" otherwise.
 * The boundary date is shown on both sides of a change on purpose: the old
 * period ends the day the new one starts, with no minus-one-day arithmetic.
 */
export function periodLabel(
    validFrom: string,
    validTo: string | null,
    fromPrefix: string,
): string {
    return validTo === null
        ? `${fromPrefix} ${formatPeriodDate(validFrom)}`
        : `${formatPeriodDate(validFrom)} – ${formatPeriodDate(validTo)}`;
}
