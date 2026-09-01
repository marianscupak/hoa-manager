import { useTranslation } from "react-i18next";

import { cn } from "@hoa-mngr/ui/lib/utils";

interface ModeStepProps {
    value: "PER_ROLLAM" | "ASSEMBLY_RECORD";
    onChange: (mode: "PER_ROLLAM" | "ASSEMBLY_RECORD") => void;
}

const MODES = ["PER_ROLLAM", "ASSEMBLY_RECORD"] as const;

export function ModeStep({ value, onChange }: ModeStepProps) {
    const { t } = useTranslation(["voting"]);
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {MODES.map((mode) => (
                <button
                    key={mode}
                    type="button"
                    onClick={() => onChange(mode)}
                    className={cn(
                        "focus-visible:ring-ring cursor-pointer rounded-xl border p-5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                        value === mode
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50",
                    )}
                >
                    <p className="font-semibold">
                        {t(`voting:create.mode.${mode}.title`)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {t(`voting:create.mode.${mode}.description`)}
                    </p>
                </button>
            ))}
        </div>
    );
}
