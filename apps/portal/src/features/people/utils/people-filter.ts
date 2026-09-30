import type { PersonResponseDto } from "@/api/generated/model";

export type PeopleFilter = "all" | "owners" | "withAccess" | "withoutAccount";

/**
 * `DataTable` keys rows by `id`; the API calls it `key`, because on the wire
 * it is not an entity id — it says which of two tables the row came from.
 */
export type PersonRow = PersonResponseDto & { id: string };

export const toPersonRows = (people: PersonResponseDto[]): PersonRow[] =>
    people.map((person) => ({ ...person, id: person.key }));

/**
 * The shape the owner dialogs already take. They only read `id` and
 * `displayName`, but the id they want is the owner's — not the row key, which
 * is prefixed to keep the two sources apart.
 */
export const toOwnerRef = (
    person: Pick<PersonRow, "ownerId" | "displayName"> | null,
) =>
    person?.ownerId
        ? { id: person.ownerId, displayName: person.displayName }
        : null;

export const PEOPLE_FILTERS: PeopleFilter[] = [
    "all",
    "owners",
    "withAccess",
    "withoutAccount",
];

/**
 * The pills are defined by what a row holds, not by which table it came from.
 *
 * "Vlastníci" means someone who holds a unit today — an owner record created
 * but never attached to one owns nothing. "S přístupem" ignores membership
 * status on purpose: a deactivated member still has an account, and finding
 * them is exactly what an admin reaches for this filter to do.
 */
export function filterPeople<T extends PersonResponseDto>(
    people: T[],
    filter: PeopleFilter,
): T[] {
    switch (filter) {
        case "owners":
            return people.filter((p) => p.unitCount > 0);
        case "withAccess":
            return people.filter((p) => p.membershipId !== null);
        case "withoutAccount":
            return people.filter(
                (p) => p.ownerId !== null && p.membershipId === null,
            );
        default:
            return people;
    }
}
