import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

type PreviewUnit = KatastrImportPreviewResponseDto["units"][number];
type PreviewOwner = KatastrImportPreviewResponseDto["owners"][number];
type OwnershipParty = NonNullable<PreviewUnit["ownershipChange"]>["to"][number];

export type ImportRowAction = PreviewUnit["action"] | "NOT_IN_FILE";

/**
 * One changed field on a unit, as the Detail cell shows it: a label, the
 * value that is there now, and the value the file would put there. `from`
 * is `null` when there is nothing to strike through — a unit being created,
 * or ownership recorded for the first time.
 */
export interface ImportDetailPart {
    field: "unitNo" | "share" | "usage" | "ownership";
    from: string | null;
    to: string;
}

export interface ImportRow {
    id: string;
    unitNo: string;
    action: ImportRowAction;
    parts: ImportDetailPart[];
}

/** Creates first, then updates, then unchanged, then what the file omits —
 *  most consequential to least, so the admin reads the writes before the
 *  reassurances. */
const ACTION_ORDER: Record<ImportRowAction, number> = {
    CREATE: 0,
    UPDATE: 1,
    UNCHANGED: 2,
    NOT_IN_FILE: 3,
};

/** "Nováková Jana and Novák Petr (1/2), Město Praha (1/2)". `memberJoin`
 *  comes from the catalogue because the two names of a marital community
 *  property are joined by a word, not a symbol. */
export function describeOwnership(
    parties: OwnershipParty[],
    memberJoin: string,
): string {
    return parties
        .map(
            (party) => `${party.memberNames.join(memberJoin)} (${party.share})`,
        )
        .join(", ");
}

/**
 * A unit being created has no previous value, and the API spells that as
 * an empty string on `shareChange.from` rather than omitting the change.
 * Rendered as-is it would print a bare "→" with nothing before it, so a
 * blank reads as "nothing to strike through" — the same as `null`.
 */
function previousValue(from: string | null): string | null {
    return from === null || from.trim() === "" ? null : from;
}

export function unitDetailParts(
    unit: PreviewUnit,
    memberJoin: string,
): ImportDetailPart[] {
    const parts: ImportDetailPart[] = [];

    if (unit.unitNoChange) {
        parts.push({
            field: "unitNo",
            from: previousValue(unit.unitNoChange.from),
            to: unit.unitNoChange.to,
        });
    }
    if (unit.shareChange) {
        parts.push({
            field: "share",
            from: previousValue(unit.shareChange.from),
            to: unit.shareChange.to,
        });
    }
    if (unit.usageChange) {
        parts.push({
            field: "usage",
            from: previousValue(unit.usageChange.from),
            // Clearing the usage is a change worth showing, and an em-dash
            // reads as "nothing" where an empty cell reads as a bug.
            to: unit.usageChange.to ?? "—",
        });
    }
    if (unit.ownershipChange) {
        const { from, to } = unit.ownershipChange;
        parts.push({
            field: "ownership",
            from:
                from.length === 0 ? null : describeOwnership(from, memberJoin),
            to: describeOwnership(to, memberJoin),
        });
    }

    return parts;
}

/**
 * Every row the units table can show, in reading order. `unitsNotInFile`
 * are units the register has and the extract does not — they are listed so
 * the admin can see the import leaves them alone, never as an omission.
 */
export function buildImportRows(
    preview: KatastrImportPreviewResponseDto,
    memberJoin: string,
): ImportRow[] {
    const rows: ImportRow[] = [
        ...preview.units.map((unit) => ({
            id: unit.unitNo,
            unitNo: unit.unitNo,
            action: unit.action,
            parts: unitDetailParts(unit, memberJoin),
        })),
        ...preview.unitsNotInFile.map((unit) => ({
            id: unit.unitNo,
            unitNo: unit.unitNo,
            action: "NOT_IN_FILE" as const,
            parts: [],
        })),
    ];

    // Stable, so units keep the order the API sent them in within a group.
    return rows.sort((a, b) => ACTION_ORDER[a.action] - ACTION_ORDER[b.action]);
}

/** Unchanged rows are the bulk of a typical extract and say nothing; they
 *  stay behind the toggle. Rows the file omits are not "unchanged" and are
 *  always shown — they are the only place the admin sees that nothing is
 *  being deleted. */
export function visibleImportRows(
    rows: ImportRow[],
    showUnchanged: boolean,
): ImportRow[] {
    return showUnchanged
        ? rows
        : rows.filter((row) => row.action !== "UNCHANGED");
}

/**
 * The owners the admin actually has to verify: the ones being created, and
 * the ones matched on a name alone. A cadastre-ID or IČO match is exact, so
 * it needs no second pair of eyes and stays behind the "show all" toggle.
 */
export function ownersNeedingALook(owners: PreviewOwner[]): PreviewOwner[] {
    return owners.filter(
        (owner) =>
            owner.action === "CREATE" || owner.action === "MATCHED_BY_NAME",
    );
}
