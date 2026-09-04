import { useTranslation } from "react-i18next";

import {
    FractionInput,
    formatFraction,
    fractionsEqual,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    type Fraction,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

export type ThresholdComparator = "STRICT_GREATER" | "AT_LEAST";

interface ThresholdPickerProps {
    value: Fraction | undefined;
    onChange: (value: Fraction | undefined) => void;
    comparator: ThresholdComparator;
    onComparatorChange: (comparator: ThresholdComparator) => void;
}

const PRESETS: Fraction[] = [
    { num: 1, den: 2 },
    { num: 3, den: 5 },
    { num: 2, den: 3 },
    { num: 3, den: 4 },
];

const isSamePreset = (a: Fraction | undefined, b: Fraction): boolean =>
    !!a && fractionsEqual(a, b);

/**
 * Threshold picker shared by the majority (qualified majority) and quorum
 * (assembly quorum) fraction inputs. A raw `Fraction | undefined` in, out —
 * the caller (ruleset-form-fields.tsx) wires it into the relevant
 * react-hook-form field via `watch`/`setValue`.
 */
export function ThresholdPicker({
    value,
    onChange,
    comparator,
    onComparatorChange,
}: ThresholdPickerProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                    <button
                        key={formatFraction(preset)}
                        type="button"
                        onClick={() => onChange(preset)}
                        className={cn(
                            "focus-visible:ring-ring cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                            isSamePreset(value, preset)
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border hover:bg-muted/50",
                        )}
                    >
                        {formatFraction(preset)}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-muted-foreground text-xs font-semibold">
                        {t("voting:create.thresholdPicker.customLabel")}
                    </label>
                    <FractionInput
                        value={value ?? null}
                        onChange={(next) => onChange(next ?? undefined)}
                        placeholder={t(
                            "voting:create.thresholdPicker.customPlaceholder",
                        )}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-muted-foreground text-xs font-semibold">
                        {t("voting:create.thresholdPicker.comparatorLabel")}
                    </label>
                    <Select
                        value={comparator}
                        onValueChange={(next) =>
                            onComparatorChange(next as ThresholdComparator)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AT_LEAST">
                                {t(
                                    "voting:create.thresholdPicker.comparator.AT_LEAST",
                                )}
                            </SelectItem>
                            <SelectItem value="STRICT_GREATER">
                                {t(
                                    "voting:create.thresholdPicker.comparator.STRICT_GREATER",
                                )}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
