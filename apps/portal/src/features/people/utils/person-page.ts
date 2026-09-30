import type { PersonResponseDto } from "@/api/generated/model";

import { toPersonRows, type PersonRow } from "./people-filter";

export type PersonPageState =
    | { kind: "loading" }
    | { kind: "error" }
    | { kind: "notFound" }
    | { kind: "found"; person: PersonRow; people: PersonRow[] };

/**
 * Which of its four faces the person page shows.
 *
 * An error only wins when there is nothing to show: TanStack keeps the last
 * data when a background refetch fails, and a blip after a mutation must
 * not throw away the page the admin is working on.
 */
export function personPageState(
    query: {
        isLoading: boolean;
        isError: boolean;
        data: PersonResponseDto[] | undefined;
    },
    key: string | undefined,
): PersonPageState {
    if (query.data) {
        const people = toPersonRows(query.data);
        const person = people.find((p) => p.key === key);
        return person
            ? { kind: "found", person, people }
            : { kind: "notFound" };
    }
    if (query.isError) return { kind: "error" };
    return { kind: "loading" };
}
