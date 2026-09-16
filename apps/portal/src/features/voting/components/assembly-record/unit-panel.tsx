import { CheckIcon, ChevronLeft, ChevronRight, MinusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Input, StatusChip, formatPercent } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { AssemblyRecordResponseDto } from "@/api/generated/model";
import { sharePercent } from "@/features/units/utils/shares";

import type { AssemblyUnit } from "./roster";

type Question = AssemblyRecordResponseDto["questions"][number];

/** Icons follow the option's meaning, not its position. */
const OPTION_ICON: Record<string, typeof CheckIcon> = {
    YES: CheckIcon,
    NO: XIcon,
    ABSTAIN: MinusIcon,
};

/** Spelled out rather than interpolated: the i18n keys are typed. */
const INELIGIBLE_KEY: Record<string, string> = {
    NO_REPRESENTATIVE:
        "voting:assemblyRecord.unit.ineligible.NO_REPRESENTATIVE",
    MISSING_OWNERSHIP:
        "voting:assemblyRecord.unit.ineligible.MISSING_OWNERSHIP",
    ASSOCIATION_OWNED:
        "voting:assemblyRecord.unit.ineligible.ASSOCIATION_OWNED",
};

const OPTION_TONE: Record<string, string> = {
    YES: "text-success-tint-foreground",
    NO: "text-destructive-muted-foreground",
    ABSTAIN: "text-secondary-foreground",
};

interface UnitPanelProps {
    unit: AssemblyUnit;
    questions: Question[];
    index: number;
    total: number;
    allVotesWeight: { num: string; den: string };
    onPrev: () => void;
    onNext: () => void;
    onPresent: (voter: { ownerId: string | null; note: string | null }) => void;
    onAbsent: () => void;
    onAnswer: (answers: { questionId: string; optionId: string }[]) => void;
}

export function UnitPanel({
    unit,
    questions,
    index,
    total,
    allVotesWeight,
    onPrev,
    onNext,
    onPresent,
    onAbsent,
    onAnswer,
}: UnitPanelProps) {
    const { t } = useTranslation(["voting"]);

    // Who voted, chosen before any answer can be entered. `PROXY` means a
    // holder of a power of attorney who is not an owner on record.
    const [voterChoice, setVoterChoice] = useState<string | null>(null);
    const [proxyName, setProxyName] = useState("");

    useEffect(() => {
        setVoterChoice(unit.voterOwnerId ?? (unit.voterNote ? "PROXY" : null));
        setProxyName(unit.voterNote ?? "");
    }, [unit.unitId, unit.voterOwnerId, unit.voterNote]);

    const ineligible = unit.eligibility === "INELIGIBLE";
    const sharePct = sharePercent(
        Number(unit.share.num),
        Number(unit.share.den),
    );
    const allPct =
        sharePercent(Number(allVotesWeight.num), Number(allVotesWeight.den)) ||
        1;

    const commitVoter = (choice: string | null, note: string) => {
        if (!choice) return;
        onPresent(
            choice === "PROXY"
                ? { ownerId: null, note: note.trim() || null }
                : { ownerId: choice, note: null },
        );
    };

    const answerFor = (questionId: string) =>
        unit.answers.find((a) => a.questionId === questionId)?.optionId ?? null;

    const chooseOption = (questionId: string, optionId: string) => {
        // A ballot answers every question at once, so an answer is only sent
        // when the last question has been filled in.
        const next = questions.map((q) => ({
            questionId: q.questionId,
            optionId:
                q.questionId === questionId ? optionId : answerFor(q.questionId),
        }));
        if (next.every((a) => a.optionId)) {
            onAnswer(next as { questionId: string; optionId: string }[]);
        }
    };

    const voterChosen =
        voterChoice !== null && (voterChoice !== "PROXY" || !!proxyName.trim());

    return (
        <div className="rounded-card bg-card shadow-clay-card border p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-faint text-[11px] font-semibold tracking-wide uppercase">
                        {t("voting:assemblyRecord.unit.eyebrow", {
                            index: index + 1,
                            total,
                        })}
                    </p>
                    <h2 className="font-display mt-1 truncate text-2xl font-extrabold">
                        {unit.unitNo}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {unit.owners.map((o) => o.displayName).join(", ") ||
                            t("voting:assemblyRecord.roster.noOwner")}
                        {" · "}
                        {t("voting:assemblyRecord.unit.share", {
                            num: unit.share.num,
                            den: unit.share.den,
                            percent: formatPercent((sharePct / allPct) * 100),
                        })}
                    </p>
                    {unit.owners.length > 1 && (
                        <StatusChip variant="warning" className="mt-2">
                            {t("voting:assemblyRecord.unit.coOwned")}
                        </StatusChip>
                    )}
                </div>

                <div className="flex shrink-0 gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrev}
                        aria-label={t("voting:assemblyRecord.unit.prev")}
                        className="h-8 w-8 cursor-pointer rounded-full"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNext}
                        aria-label={t("voting:assemblyRecord.unit.next")}
                        className="h-8 w-8 cursor-pointer rounded-full"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {ineligible ? (
                <div className="rounded-panel bg-accent text-secondary-foreground mt-5 border p-4 text-sm">
                    {t(
                        (INELIGIBLE_KEY[
                            unit.ineligibleReason ?? "NO_REPRESENTATIVE"
                        ] ??
                            INELIGIBLE_KEY
                                .NO_REPRESENTATIVE) as "voting:assemblyRecord.unit.ineligible.NO_REPRESENTATIVE",
                    )}
                </div>
            ) : (
                <>
                    <p className="mt-5 text-sm font-semibold">
                        {t("voting:assemblyRecord.unit.attendanceQuestion")}
                    </p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <SelectionCard
                            selected={unit.attendance === "PRESENT"}
                            title={t("voting:assemblyRecord.unit.present")}
                            hint={t("voting:assemblyRecord.unit.presentHint")}
                            onClick={() =>
                                voterChosen
                                    ? commitVoter(voterChoice, proxyName)
                                    : undefined
                            }
                            disabled={!voterChosen}
                        />
                        <SelectionCard
                            selected={unit.attendance === "ABSENT"}
                            neutral
                            title={t("voting:assemblyRecord.unit.absent")}
                            hint={t("voting:assemblyRecord.unit.absentHint")}
                            onClick={onAbsent}
                        />
                    </div>

                    {unit.attendance !== "ABSENT" && (
                        <div className="mt-5">
                            <p className="text-sm font-semibold">
                                {t("voting:assemblyRecord.unit.voterQuestion")}
                            </p>
                            <div className="mt-2 space-y-2">
                                {unit.owners.map((owner) => (
                                    <RadioRow
                                        key={owner.ownerId}
                                        checked={voterChoice === owner.ownerId}
                                        label={owner.displayName}
                                        hint={t(
                                            "voting:assemblyRecord.unit.voterOwner",
                                        )}
                                        onSelect={() => {
                                            setVoterChoice(owner.ownerId);
                                            commitVoter(owner.ownerId, "");
                                        }}
                                    />
                                ))}
                                <RadioRow
                                    checked={voterChoice === "PROXY"}
                                    label={t(
                                        "voting:assemblyRecord.unit.voterProxy",
                                    )}
                                    onSelect={() => setVoterChoice("PROXY")}
                                />
                                {voterChoice === "PROXY" && (
                                    <Input
                                        value={proxyName}
                                        onChange={(e) =>
                                            setProxyName(e.target.value)
                                        }
                                        onBlur={() =>
                                            commitVoter("PROXY", proxyName)
                                        }
                                        placeholder={t(
                                            "voting:assemblyRecord.unit.voterProxyPlaceholder",
                                        )}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {unit.attendance === "PRESENT" && voterChosen && (
                        <div className="mt-6 space-y-4">
                            {questions.map((question, qIndex) => (
                                <div
                                    key={question.questionId}
                                    className="rounded-panel border p-4"
                                >
                                    <p className="text-faint text-[11px] font-semibold tracking-wide uppercase">
                                        {t(
                                            "voting:assemblyRecord.unit.resolution",
                                            { index: qIndex + 1 },
                                        )}
                                    </p>
                                    <p className="font-display mt-1 text-[17.5px] font-extrabold">
                                        {question.title}
                                    </p>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                        {question.options.map((option) => {
                                            const Icon =
                                                OPTION_ICON[option.optionKey] ??
                                                MinusIcon;
                                            const chosen =
                                                answerFor(
                                                    question.questionId,
                                                ) === option.optionId;
                                            return (
                                                <button
                                                    key={option.optionId}
                                                    type="button"
                                                    onClick={() =>
                                                        chooseOption(
                                                            question.questionId,
                                                            option.optionId,
                                                        )
                                                    }
                                                    className={cn(
                                                        "flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-full border-2 text-sm font-semibold transition-colors",
                                                        chosen
                                                            ? "border-primary bg-primary-faint"
                                                            : "border-border hover:bg-accent",
                                                        chosen &&
                                                            OPTION_TONE[
                                                                option.optionKey
                                                            ],
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            <p className="text-faint text-[11.5px]">
                                {t("voting:assemblyRecord.unit.answersFootnote")}
                            </p>
                        </div>
                    )}

                    {unit.attendance === "ABSENT" && (
                        <div className="rounded-panel bg-accent text-secondary-foreground mt-5 border p-4 text-sm">
                            {t("voting:assemblyRecord.unit.absentExplainer", {
                                percent: formatPercent((sharePct / allPct) * 100),
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SelectionCard({
    selected,
    neutral,
    title,
    hint,
    onClick,
    disabled,
}: {
    selected: boolean;
    neutral?: boolean;
    title: string;
    hint: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "rounded-tile border-2 p-3 text-left transition-colors",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                selected && !neutral && "border-primary bg-primary-faint",
                // Absent is a deliberate, neutral choice — never an error tone.
                selected && neutral && "border-secondary-foreground bg-accent",
                !selected && "border-border hover:bg-accent",
            )}
        >
            <span className="block text-sm font-semibold">{title}</span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
                {hint}
            </span>
        </button>
    );
}

function RadioRow({
    checked,
    label,
    hint,
    onSelect,
}: {
    checked: boolean;
    label: string;
    hint?: string;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                checked ? "border-primary bg-primary-faint" : "hover:bg-accent",
            )}
        >
            <span
                className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                    checked ? "border-primary" : "border-border",
                )}
            >
                {checked && <span className="bg-primary h-2 w-2 rounded-full" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                    {label}
                </span>
                {hint && (
                    <span className="text-muted-foreground block text-xs">
                        {hint}
                    </span>
                )}
            </span>
        </button>
    );
}
