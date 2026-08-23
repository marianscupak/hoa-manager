import type {
    VoteOptionResponseDto,
    VoteQuestionResultDto,
} from "@/api/generated/model";

export type QuestionVerdict = "approved" | "rejected" | "winner" | "notDecided";

export interface QuestionVerdictOutcome {
    verdict: QuestionVerdict;
    winningOption: VoteOptionResponseDto | null;
}

// Mirrors the server's deriveQuestionOutcome (spec §3): quorum is vote-level;
// for yes/no questions "majority met" can mean NO won — approval requires the
// YES-semantic option to be the winner. `quorumMet: null` (per-rollam votes,
// which have no quorum by law) passes straight through to the majority
// logic, same as the server — only an explicit `false` blocks the verdict.
export function mapQuestionVerdict(args: {
    quorumMet: boolean | null;
    questionType: string;
    result: VoteQuestionResultDto;
    options: VoteOptionResponseDto[];
}): QuestionVerdictOutcome {
    const winningOption =
        args.options.find((o) => o.id === args.result.winningOptionId) ?? null;

    if (args.quorumMet === false) {
        return { verdict: "notDecided", winningOption };
    }
    if (args.questionType === "YES_NO") {
        const approved =
            args.result.majorityMet && winningOption?.optionKey === "YES";
        return { verdict: approved ? "approved" : "rejected", winningOption };
    }
    return {
        verdict: args.result.majorityMet ? "winner" : "notDecided",
        winningOption,
    };
}
