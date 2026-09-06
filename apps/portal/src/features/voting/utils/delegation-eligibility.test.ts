import { describe, expect, it } from "vitest";

import type {
    OwningUnitStatusDto,
    VoteListItemResponseDto,
} from "@/api/generated/model";

import {
    consentRisk,
    delegationPrompt,
    votesDelegableByMember,
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

    it("offers nothing for a unit held on someone else's behalf — it is not theirs to pass on", () => {
        expect(delegationPrompt("SCHEDULED", [unit("PROXY")])).toBeNull();
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

describe("votesDelegableByMember", () => {
    const scheduled = (id: string) =>
        ({ id, status: "SCHEDULED" }) as VoteListItemResponseDto;

    it("keeps the scheduled votes where the member still holds a unit of their own", () => {
        const votes = [scheduled("ready"), scheduled("requires")];
        const statuses = new Map([
            ["ready", [unit("READY")]],
            ["requires", [unit("REQUIRES_DELEGATION")]],
        ]);
        expect(
            votesDelegableByMember(votes, statuses).map((v) => v.id),
        ).toEqual(["ready", "requires"]);
    });

    it("drops votes where nothing is left to hand over", () => {
        const votes = [scheduled("spent"), scheduled("proxy")];
        const statuses = new Map([
            ["spent", [unit("VOTED"), unit("DELEGATED"), unit("INELIGIBLE")]],
            // Held on someone else's behalf — not theirs to pass on.
            ["proxy", [unit("PROXY")]],
        ]);
        expect(votesDelegableByMember(votes, statuses)).toEqual([]);
    });

    it("drops a vote whose voter status has not arrived, rather than guessing", () => {
        expect(votesDelegableByMember([scheduled("v1")], new Map())).toEqual(
            [],
        );
    });

    it("drops votes that are not scheduled even when a unit could be delegated", () => {
        const votes = [
            { id: "open", status: "OPEN" } as VoteListItemResponseDto,
        ];
        const statuses = new Map([["open", [unit("READY")]]]);
        expect(votesDelegableByMember(votes, statuses)).toEqual([]);
    });

    it("has nothing to offer before the vote list has loaded", () => {
        expect(votesDelegableByMember(undefined, new Map())).toEqual([]);
    });
});

describe("consentRisk", () => {
    it("flags a consent that would leave the unit with no representative", () => {
        expect(
            consentRisk({ wouldLeaveUnitWithoutRepresentative: true }, false),
        ).toBe("noRepresentative");
    });

    it("stays silent when the consent leaves a representative in place", () => {
        expect(
            consentRisk({ wouldLeaveUnitWithoutRepresentative: false }, false),
        ).toBeNull();
    });

    it("stays silent before any preview has arrived", () => {
        expect(consentRisk(undefined, false)).toBeNull();
    });

    it("stays silent while a preview for a new selection is in flight", () => {
        // Whatever is in hand describes the previous choice, so it must not be
        // shown against the one the member is looking at now.
        expect(
            consentRisk({ wouldLeaveUnitWithoutRepresentative: true }, true),
        ).toBeNull();
    });
});
