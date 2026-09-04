import { describe, expect, it } from "vitest";

import type {
    OwningUnitStatusDto,
    VoteListItemResponseDto,
} from "@/api/generated/model";

import {
    delegationPrompt,
    votesOpenForDelegation,
} from "./delegation-eligibility";

const unit = (status: OwningUnitStatusDto["status"]): OwningUnitStatusDto => ({
    id: `unit-${status}`,
    name: "Jednotka 4",
    share: "1650/10000",
    status,
});

describe("delegationPrompt", () => {
    it("requires a delegation when a co-owned unit has no representative yet", () => {
        expect(
            delegationPrompt("SCHEDULED", [unit("REQUIRES_DELEGATION")]),
        ).toBe("required");
    });

    it("offers a delegation for a unit that is ready while the vote is still scheduled", () => {
        expect(delegationPrompt("SCHEDULED", [unit("READY")])).toBe(
            "available",
        );
    });

    it("prefers the required prompt when one unit is ready and another is not", () => {
        expect(
            delegationPrompt("SCHEDULED", [
                unit("READY"),
                unit("REQUIRES_DELEGATION"),
            ]),
        ).toBe("required");
    });

    it("offers nothing once the vote is open, since the electorate is frozen", () => {
        expect(delegationPrompt("OPEN", [unit("READY")])).toBeNull();
        expect(delegationPrompt("CLOSED", [unit("READY")])).toBeNull();
    });

    it("offers nothing for units that already voted, delegated or are ineligible", () => {
        expect(
            delegationPrompt("SCHEDULED", [
                unit("VOTED"),
                unit("DELEGATED"),
                unit("INELIGIBLE"),
            ]),
        ).toBeNull();
        expect(delegationPrompt("SCHEDULED", [])).toBeNull();
    });
});

describe("votesOpenForDelegation", () => {
    it("keeps only scheduled votes, the sole status the API accepts a consent in", () => {
        const votes = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "CANCELLED"].map(
            (status) => ({ id: status, status }) as VoteListItemResponseDto,
        );
        expect(votesOpenForDelegation(votes).map((v) => v.id)).toEqual([
            "SCHEDULED",
        ]);
        expect(votesOpenForDelegation(undefined)).toEqual([]);
    });
});
