import { useTranslation } from "react-i18next";

import { Button, Card } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import {
    DelegationCandidateDto,
    OwningUnitStatusDto,
} from "@/api/generated/model";

import type { ConsentRisk } from "../../utils/delegation-eligibility";
import { ConsentRiskNotice } from "./consent-risk-notice";

interface DelegationSummaryProps {
    selectedUnit: OwningUnitStatusDto | null | undefined;
    selectedDelegate: DelegationCandidateDto | null | undefined;
    risk: ConsentRisk | null;
    isPending: boolean;
    onConfirm: () => void;
    isValid: boolean;
}

export const DelegationSummary = ({
    selectedUnit,
    selectedDelegate,
    risk,
    isPending,
    onConfirm,
    isValid,
}: DelegationSummaryProps) => {
    const { t } = useTranslation("voting");

    return (
        <Card className="overflow-hidden border-2 p-0 shadow-sm">
            <div className="bg-muted/30 border-b p-4">
                <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("delegate.summary.title")}
                </h3>
            </div>
            <div className="space-y-6 p-6">
                <div className="space-y-4">
                    <div className="border-muted flex items-center justify-between border-b border-dashed py-1 pb-3">
                        <span className="text-muted-foreground">
                            {t("delegate.summary.unit")}
                        </span>
                        <span
                            className={cn(
                                "font-medium",
                                !selectedUnit &&
                                    "text-muted-foreground text-sm italic",
                            )}
                        >
                            {selectedUnit?.name ||
                                t("delegate.summary.notSelected")}
                        </span>
                    </div>
                    <div className="border-muted flex items-center justify-between border-b border-dashed py-1 pb-3">
                        <span className="text-muted-foreground">
                            {t("delegate.summary.voteShare")}
                        </span>
                        <span
                            className={cn(
                                "font-medium",
                                !selectedUnit &&
                                    "text-muted-foreground text-sm italic",
                            )}
                        >
                            {selectedUnit?.share ? selectedUnit.share : "-"}
                        </span>
                    </div>
                    <div className="border-muted flex items-center justify-between border-b border-dashed py-1 pb-3">
                        <span className="text-muted-foreground">
                            {t("delegate.summary.delegate")}
                        </span>
                        <span
                            className={cn(
                                "font-medium",
                                !selectedDelegate &&
                                    "text-muted-foreground text-sm italic",
                            )}
                        >
                            {selectedDelegate?.name ||
                                t("delegate.summary.notSelected")}
                        </span>
                    </div>
                </div>

                <ConsentRiskNotice risk={risk} />

                <Button
                    className="h-12 w-full text-lg font-semibold shadow-lg"
                    disabled={!isValid || isPending}
                    onClick={onConfirm}
                >
                    {isPending
                        ? t("delegate.confirming")
                        : t("delegate.confirmButton")}
                </Button>

                <p className="text-muted-foreground text-2xs px-4 text-center leading-relaxed tracking-widest uppercase">
                    {t("delegate.terms")}
                </p>
            </div>
        </Card>
    );
};
