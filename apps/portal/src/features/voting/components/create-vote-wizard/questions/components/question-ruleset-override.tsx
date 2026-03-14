import { Settings2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, cn } from "@hoa-mngr/ui";

import { RulesetFormFields } from "../../shared/ruleset-form-fields";

interface QuestionRulesetOverrideProps {
    hasOverride: boolean;
    isOverrideVisible: boolean;
    onToggleVisibility: () => void;
    onApplyCustomRules: () => void;
    onUpdateRuleset: () => void;
    onRemoveOverride: () => void;
    isUpdating: boolean;
}

export function QuestionRulesetOverride({
    hasOverride,
    isOverrideVisible,
    onToggleVisibility,
    onApplyCustomRules,
    onUpdateRuleset,
    onRemoveOverride,
    isUpdating,
}: QuestionRulesetOverrideProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="border-t pt-4">
            <button
                type="button"
                onClick={onToggleVisibility}
                className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
                        <p className="text-muted-foreground text-sm">
                            {t(
                                "voting:create.steps.questions.override.description",
                            )}
                        </p>
                        {hasOverride && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs"
                                onClick={onRemoveOverride}
                            >
                                <Trash2 className="mr-1 h-3 w-3" />
                                {t(
                                    "voting:create.steps.questions.override.remove",
                                )}
                            </Button>
                        )}
                    </div>

                    <RulesetFormFields />

                    <div className="mt-4 flex justify-end">
                        {!hasOverride ? (
                            <Button
                                type="button"
                                size="sm"
                                onClick={onApplyCustomRules}
                                disabled={isUpdating}
                            >
                                {t(
                                    "voting:create.steps.questions.override.apply",
                                )}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                onClick={onUpdateRuleset}
                                disabled={isUpdating}
                            >
                                {t(
                                    "voting:create.steps.questions.override.update",
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
