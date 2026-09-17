import { AxiosError } from "axios";

/** One vote the move reaches, as the API reports it. */
export interface AffectedVote {
    voteId: string;
    title: string;
    mode: "PER_ROLLAM" | "ASSEMBLY_RECORD";
    /**
     * `LIVE` — the vote still reads the register, so the move changes who may
     * vote. `FROZEN` — its electorate and result were snapshotted, so nothing
     * recomputes and only the record stops matching the register.
     */
    impact: "LIVE" | "FROZEN";
}

/**
 * The votes carried by a refusal, or null when the error is a different one.
 *
 * The API answers `422 { code: "OWNERSHIP_PERIOD_AFFECTS_VOTES", votes }`
 * until the board confirms, which is what turns the refusal into the warning
 * the dialog shows.
 */
export function affectedVotesFrom(error: unknown): AffectedVote[] | null {
    if (!(error instanceof AxiosError)) return null;
    const data = error.response?.data as
        | { code?: string; votes?: AffectedVote[] }
        | undefined;
    if (data?.code !== "OWNERSHIP_PERIOD_AFFECTS_VOTES") return null;
    return data.votes ?? [];
}
