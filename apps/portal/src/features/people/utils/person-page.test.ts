import { describe, expect, it } from "vitest";

import type { PersonResponseDto } from "@/api/generated/model";

import { personPageState } from "./person-page";

const jana = { key: "owner:o1", displayName: "Jana" } as PersonResponseDto;

describe("personPageState", () => {
    it("is loading on the first fetch", () => {
        expect(
            personPageState(
                { isLoading: true, isError: false, data: undefined },
                "owner:o1",
            ),
        ).toEqual({ kind: "loading" });
    });

    it("is an error only when there is nothing to show", () => {
        expect(
            personPageState(
                { isLoading: false, isError: true, data: undefined },
                "owner:o1",
            ),
        ).toEqual({ kind: "error" });
    });

    it("keeps the page when a background refetch fails", () => {
        // TanStack keeps the last data and sets isError; a blip after a
        // mutation must not throw away the page the admin is working on.
        const state = personPageState(
            { isLoading: false, isError: true, data: [jana] },
            "owner:o1",
        );
        expect(state.kind).toBe("found");
    });

    it("is not found when no row carries the key", () => {
        expect(
            personPageState(
                { isLoading: false, isError: false, data: [jana] },
                "owner:gone",
            ),
        ).toEqual({ kind: "notFound" });
    });

    it("finds the row by its key", () => {
        const state = personPageState(
            { isLoading: false, isError: false, data: [jana] },
            "owner:o1",
        );
        expect(state).toMatchObject({
            kind: "found",
            person: { key: "owner:o1" },
        });
    });
});
