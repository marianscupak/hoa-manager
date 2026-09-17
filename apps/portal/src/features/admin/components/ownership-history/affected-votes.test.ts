import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { affectedVotesFrom } from "./affected-votes";

const refusal = (data: unknown) => {
    const error = new AxiosError("Unprocessable");
    error.response = { data } as never;
    return error;
};

describe("affectedVotesFrom", () => {
    it("reads the votes out of the refusal that carries them", () => {
        const votes = affectedVotesFrom(
            refusal({
                code: "OWNERSHIP_PERIOD_AFFECTS_VOTES",
                votes: [
                    {
                        voteId: "v1",
                        title: "Shromáždění 2026",
                        mode: "ASSEMBLY_RECORD",
                        impact: "LIVE",
                    },
                ],
            }),
        );

        expect(votes).toEqual([
            expect.objectContaining({ voteId: "v1", impact: "LIVE" }),
        ]);
    });

    it("returns an empty list when the refusal names no vote", () => {
        expect(
            affectedVotesFrom(
                refusal({ code: "OWNERSHIP_PERIOD_AFFECTS_VOTES" }),
            ),
        ).toEqual([]);
    });

    it("ignores an unrelated error, so it falls through to the toast", () => {
        expect(
            affectedVotesFrom(refusal({ code: "OWNERSHIP_PERIOD_OVERLAPS" })),
        ).toBeNull();
        expect(affectedVotesFrom(new Error("network"))).toBeNull();
    });
});
