import { Settings2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, cn } from "@hoa-mngr/ui";

import { RulesetFormFields } from "../../shared/ruleset-form-fields";

interface QuestionRulesetOverrideProps {
    mode: "PER_ROLLAM" | "ASSEMBLY_RECORD";
    hasOverride: boolean;
    isOverrideVisible: boolean;
    onToggleVisibility: () => void;
    onRemoveOverride: () => void;
}

export function QuestionRulesetOverride({
    mode,
    hasOverride,
    isOverrideVisible,
    onToggleVisibility,
    onRemoveOverride,
}: QuestionRulesetOverrideProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="border-t pt-4">
            <button
                type="button"
                onClick={onToggleVisibility}
                className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    hasOverride
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
            >
                <Settings2 className="h-4 w-4" />
                {isOverrideVisible
                    ? t("voting:create.steps.questions.override.toggleActive")
                    : t(
                          "voting:create.steps.questions.override.toggleInactive",
                      )}
            </button>

            {!hasOverride && (
                <p className="text-muted-foreground mt-1 px-3 text-xs">
                    {t("voting:create.steps.questions.override.defaultHint")}
                </p>
            )}

            {isOverrideVisible && (
                <div className="mt-4 rounded-md border bg-slate-50/50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-muted-foreground text-sm">
                                {t(
                                    "voting:create.steps.questions.override.description",
                                )}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {t("voting:create.legal.overrideStricterOnly")}
                            </p>
                        </div>
                        {hasOverride && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs"
                                onClick={onRemoveOverride}
                            >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                {t(
                                    "voting:create.steps.questions.override.remove",
                                )}
                            </Button>
                        )}
                    </div>

                    <RulesetFormFields mode={mode} variant="majorityOnly" />
                </div>
            )}
        </div>
    );
}
