import { ArrowLeft, Check, Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Badge, Button } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

export type WizardStepId =
    | "mode"
    | "details"
    | "rules"
    | "questions"
    | "review";

export type WizardSavedState = "saved" | "dirty" | "saving";

export interface WizardShellStep {
    id: WizardStepId;
    labelKey: string;
    state: "done" | "active" | "upcoming";
    enabled: boolean;
    badge?: number;
}

export interface WizardShellProps {
    /** Vote title shown next to "New vote" in the top bar. Empty until typed/saved. */
    title: string;
    isDraft: boolean;
    /** `null` hides the indicator entirely (nothing has been saved yet). */
    savedState: WizardSavedState | null;
    steps: WizardShellStep[];
    onStepSelect: (id: WizardStepId) => void;
    /** Secondary actions under the rail note (delete draft). */
    railFooter?: React.ReactNode;
    footer: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Icon-only in the narrow top bar, icon + label from `sm` up. The label stays in
 * the accessibility tree at every width via `sr-only`.
 */
function SavedIndicator({ state }: { state: WizardSavedState }) {
    const { t } = useTranslation(["voting"]);

    const icon =
        state === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : state === "dirty" ? (
            <span className="bg-warning h-2 w-2 shrink-0 rounded-full" />
        ) : (
            <Check
                className="text-success h-3.5 w-3.5 shrink-0"
                strokeWidth={2.5}
            />
        );

    const label =
        state === "saving"
            ? t("voting:wizard.saving")
            : state === "dirty"
              ? t("voting:wizard.unsaved")
              : t("voting:wizard.saved");

    return (
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
            {icon}
            <span className="sr-only sm:not-sr-only">{label}</span>
        </span>
    );
}

function StepCircle({
    state,
    index,
}: {
    state: WizardShellStep["state"];
    index: number;
}) {
    if (state === "done") {
        return (
            <span className="bg-success text-success-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
        );
    }

    return (
        <span
            className={cn(
                "font-display bg-card flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                state === "active"
                    ? "border-primary text-primary-tint-foreground border-2"
                    : "border-border text-muted-foreground border",
            )}
        >
            {index + 1}
        </span>
    );
}

function StepRailButton({
    step,
    index,
    onSelect,
}: {
    step: WizardShellStep;
    index: number;
    onSelect: (id: WizardStepId) => void;
}) {
    const { t } = useTranslation(["voting"]);

    return (
        <button
            type="button"
            disabled={!step.enabled}
            aria-current={step.state === "active" ? "step" : undefined}
            onClick={() => onSelect(step.id)}
            className={cn(
                "focus-visible:ring-ring flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                step.state === "active" && "bg-primary-tint",
                step.enabled
                    ? cn(
                          "cursor-pointer",
                          step.state !== "active" && "hover:bg-muted",
                      )
                    : "cursor-not-allowed opacity-60",
            )}
        >
            <StepCircle state={step.state} index={index} />
            <span
                className={cn(
                    "text-sm",
                    step.state === "active"
                        ? "text-primary-tint-foreground font-semibold"
                        : step.state === "done"
                          ? "text-foreground font-medium"
                          : "text-muted-foreground font-medium",
                )}
            >
                {t(step.labelKey, { defaultValue: step.labelKey })}
                {step.badge !== undefined && step.badge > 0 && (
                    <span className="bg-muted text-secondary-foreground ml-1.5 rounded-full px-1.5 py-px text-[11px] font-semibold">
                        {step.badge}
                    </span>
                )}
            </span>
        </button>
    );
}

export function WizardShell({
    title,
    isDraft,
    savedState,
    steps,
    onStepSelect,
    railFooter,
    footer,
    children,
}: WizardShellProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <header className="bg-card sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6">
                <div className="flex min-w-0 items-center gap-3.5">
                    <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="h-8 shrink-0 px-3 text-[13px]"
                    >
                        <Link to="/voting">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            {t("voting:wizard.exit")}
                        </Link>
                    </Button>
                    <div className="bg-border hidden h-5 w-px sm:block" />
                    <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                            {t("voting:wizard.newVote")}
                            {title ? ` · ${title}` : ""}
                        </p>
                        {isDraft && (
                            <Badge variant="neutral" className="shrink-0">
                                {t("voting:wizard.draft")}
                            </Badge>
                        )}
                    </div>
                </div>

                {savedState && (
                    <div
                        aria-live="polite"
                        className="flex shrink-0 items-center"
                    >
                        <SavedIndicator state={savedState} />
                    </div>
                )}
            </header>

            <div className="flex flex-1 items-stretch">
                <aside className="bg-card hidden w-[264px] shrink-0 flex-col border-r px-5 py-7 lg:flex">
                    <p className="text-muted-foreground mb-4 px-2 text-[11px] font-semibold tracking-[0.8px] uppercase">
                        {t("voting:wizard.railTitle")}
                    </p>
                    <nav className="flex flex-col gap-0.5">
                        {steps.map((step, index) => (
                            <StepRailButton
                                key={step.id}
                                step={step}
                                index={index}
                                onSelect={onStepSelect}
                            />
                        ))}
                    </nav>
                    <div className="rounded-panel bg-muted text-muted-foreground mt-6 p-3 text-xs">
                        {t("voting:wizard.note")}
                    </div>
                    {railFooter && <div className="mt-4">{railFooter}</div>}
                </aside>

                <main className="flex min-w-0 flex-1 flex-col">
                    <div className="flex-1 px-4 py-8 md:px-12 md:py-9">
                        <div className="mx-auto w-full max-w-3xl">
                            {children}
                        </div>
                    </div>

                    <div className="bg-card/95 sticky bottom-0 border-t backdrop-blur">
                        {footer}
                    </div>
                </main>
            </div>
        </div>
    );
}
