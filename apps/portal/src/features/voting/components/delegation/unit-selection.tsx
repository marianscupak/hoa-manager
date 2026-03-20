import { CheckCircle2, Home } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { OwningUnitStatusDto } from "@/api/generated/model";

interface UnitSelectionProps {
    units: OwningUnitStatusDto[];
    selectedUnitId: string | null;
    onSelect: (id: string) => void;
}

export const UnitSelection = ({
    units,
    selectedUnitId,
    onSelect,
}: UnitSelectionProps) => {
    const { t } = useTranslation("voting");

    return (
        <section className="space-y-4">
            <div className="mb-6 flex items-center gap-3">
                <div
                    className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                        !selectedUnitId
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary",
                    )}
                >
                    {selectedUnitId ? (
                        <CheckCircle2 className="h-5 w-5" />
                    ) : (
                        "1"
                    )}
                </div>
                <h2 className="text-xl font-semibold">
                    {t("delegate.selectUnit")}
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {units.map((unit) => (
                    <Card
                        key={unit.id}
                        onClick={() => onSelect(unit.id)}
                        className={cn(
                            "relative cursor-pointer overflow-hidden border-2 p-4 transition-all",
                            selectedUnitId === unit.id
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50",
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                                    selectedUnitId === unit.id
                                        ? "border-primary"
                                        : "border-muted-foreground/30",
                                )}
                            >
                                {selectedUnitId === unit.id && (
                                    <div className="bg-primary h-2.5 w-2.5 rounded-full" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-semibold">
                                    {unit.name}
                                </p>
                            </div>
                            <div className="bg-primary/10 rounded-lg p-2">
                                <Home className="text-primary h-5 w-5" />
                            </div>
                        </div>
                    </Card>
                ))}

                {units.length === 0 && (
                    <div className="text-muted-foreground rounded-xl border-2 border-dashed py-12 text-center italic">
                        {t("delegate.noSelectableUnits")}
                    </div>
                )}
            </div>
        </section>
    );
};
