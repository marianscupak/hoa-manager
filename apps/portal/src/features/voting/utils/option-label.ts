import type { TFunction } from "i18next";

/** The option keys the wizard creates for every YES/NO question. Their
 *  stored label is the key itself ("YES"), so the label is never shown raw. */
const STANDARD_OPTION_KEYS: readonly string[] = ["YES", "NO", "ABSTAIN"];

/**
 * What to print for an answer option: the translated word for a standard
 * option, the author's own label for a custom one. Every surface that shows
 * an option — booth, live tally, unit answers, verdicts, activity log — goes
 * through here so "YES" never leaks into the UI.
 */
export function getOptionLabel(
    optionKey: string,
    label: string,
    t: TFunction<"voting">,
): string {
    if (optionKey === "YES") return t("castVote.options.yes");
    if (optionKey === "NO") return t("castVote.options.no");
    if (optionKey === "ABSTAIN") return t("castVote.options.abstain");
    return label;
}

/**
 * Activity-log answers written before the option key was recorded carry only
 * the stored label. For standard options that label is the key itself, so it
 * can be recovered; anything else was a custom option.
 */
export function resolveAnswerOptionKey(answer: {
    optionKey?: string | null;
    optionText: string;
}): string {
    if (answer.optionKey) return answer.optionKey;
    return STANDARD_OPTION_KEYS.includes(answer.optionText)
        ? answer.optionText
        : "CUSTOM";
}
