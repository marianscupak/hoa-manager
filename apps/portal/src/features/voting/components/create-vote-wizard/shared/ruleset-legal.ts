import type { CreateVoteRulesetValues } from "./ruleset-schema";

type Bar = { threshold: { num: number; den: number }; comparator: "STRICT_GREATER" | "AT_LEAST" };
const FLOOR: Bar = { threshold: { num: 1, den: 2 }, comparator: "STRICT_GREATER" };

const barAtLeastAsStrict = (a: Bar, b: Bar): boolean => {
    const left = BigInt(a.threshold.num) * BigInt(b.threshold.den);
    const right = BigInt(b.threshold.num) * BigInt(a.threshold.den);
    if (left !== right) return left > right;
    return !(a.comparator === "AT_LEAST" && b.comparator === "STRICT_GREATER");
};

export const PER_ROLLAM_PRESET: CreateVoteRulesetValues = {
    weightBasis: "UNIT_SHARE",
    quorum: null,
    majorityRuleType: "SIMPLE_MAJORITY",
    majorityDenominatorBasis: "ALL_VOTES",
    majorityThreshold: undefined,
    majorityComparator: undefined,
    allowAbstain: true,
    acknowledgedNonStatutory: false,
};

export const ASSEMBLY_PRESET: CreateVoteRulesetValues = {
    ...PER_ROLLAM_PRESET,
    quorum: { measure: "UNIT_SHARE", threshold: { num: 1, den: 2 }, comparator: "STRICT_GREATER" },
    majorityDenominatorBasis: "VOTES_CAST",
};

export function tierIssues(mode: "PER_ROLLAM" | "ASSEMBLY_RECORD", v: CreateVoteRulesetValues) {
    const tier1: { code: string }[] = [];
    const tier3: ("ONE_UNIT_ONE_VOTE" | "UNIT_COUNT_QUORUM")[] = [];
    const majorityBar: Bar = {
        threshold:
            v.majorityRuleType === "QUALIFIED_MAJORITY" && v.majorityThreshold
                ? v.majorityThreshold
                : v.majorityRuleType === "UNANIMITY"
                  ? { num: 1, den: 1 }
                  : { num: 1, den: 2 },
        comparator:
            v.majorityRuleType === "QUALIFIED_MAJORITY" && v.majorityComparator
                ? v.majorityComparator
                : v.majorityRuleType === "UNANIMITY"
                  ? "AT_LEAST"
                  : "STRICT_GREATER",
    };
    if (!barAtLeastAsStrict(majorityBar, FLOOR)) tier1.push({ code: "MAJORITY_BELOW_FLOOR" });
    if (mode === "PER_ROLLAM") {
        if (v.quorum) tier1.push({ code: "PER_ROLLAM_QUORUM_PRESENT" });
        if (v.majorityRuleType !== "UNANIMITY" && v.majorityDenominatorBasis !== "ALL_VOTES") {
            tier1.push({ code: "PER_ROLLAM_BASIS_NOT_ALL_VOTES" });
        }
    } else {
        if (!v.quorum) tier1.push({ code: "ASSEMBLY_QUORUM_MISSING" });
        else {
            if (!barAtLeastAsStrict({ threshold: v.quorum.threshold, comparator: v.quorum.comparator }, FLOOR)) {
                tier1.push({ code: "ASSEMBLY_QUORUM_BELOW_FLOOR" });
            }
            if (v.quorum.measure === "UNIT_COUNT") tier3.push("UNIT_COUNT_QUORUM");
        }
    }
    if (v.weightBasis === "ONE_UNIT_ONE_VOTE") tier3.push("ONE_UNIT_ONE_VOTE");
    return { tier1, tier3 };
}
