import { CheckCircle2, Search } from "lucide-react";
import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, Card, Input } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { DelegationCandidateDto } from "@/api/generated/model";

interface DelegateSelectionProps {
    candidates: DelegationCandidateDto[];
    selectedDelegateId: string | null;
    onSelect: (id: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isEnabled: boolean;
}

export const DelegateSelection = ({
    candidates,
    selectedDelegateId,
    onSelect,
    searchQuery,
    onSearchChange,
    isEnabled,
}: DelegateSelectionProps) => {
    const { t } = useTranslation("voting");

    return (
        <section
            className={cn(
                "space-y-4 border-t pt-8 transition-opacity",
                !isEnabled && "pointer-events-none opacity-50",
            )}
        >
            <div className="mb-6 flex items-center gap-3">
                <div
                    className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                        isEnabled && !selectedDelegateId
                            ? "bg-primary text-primary-foreground"
                            : selectedDelegateId
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                    )}
                >
                    {selectedDelegateId ? (
                        <CheckCircle2 className="h-5 w-5" />
                    ) : (
                        "2"
                    )}
                </div>
                <h2 className="text-xl font-semibold">
                    {t("delegate.whoWillRepresent")}
                </h2>
            </div>

            <div className="relative mb-6">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                    placeholder={t("delegate.searchByCoOwner")}
                    className="bg-muted/30 h-12 pl-10"
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onSearchChange(e.target.value)
                    }
                />
            </div>

            <div className="space-y-2">
                {candidates.map((candidate) => (
                    <Card
                        key={candidate.membershipId}
                        onClick={() =>
                            candidate.isEligible &&
                            onSelect(candidate.membershipId)
                        }
                        className={cn(
                            "cursor-pointer border p-3 transition-all",
                            !candidate.isEligible &&
                                "bg-muted/20 cursor-not-allowed opacity-60",
                            selectedDelegateId === candidate.membershipId
                                ? "bg-primary/5 border-primary"
                                : "bg-card hover:border-primary/50",
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                    {candidate.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-medium">{candidate.name}</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {candidate.isUnitOwner && (
                                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                                            {t("delegation.coOwner")}
                                        </span>
                                    )}
                                    {candidate.hasDelegatedToRequester && (
                                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                                            {t("delegate.assignedToYou")}
                                        </span>
                                    )}
                                    {!candidate.isEligible &&
                                        !candidate.hasDelegatedToRequester && (
                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                                                {t("delegate.alreadyDelegated")}
                                            </span>
                                        )}
                                </div>
                            </div>
                            {selectedDelegateId === candidate.membershipId && (
                                <CheckCircle2 className="text-primary h-5 w-5" />
                            )}
                        </div>
                    </Card>
                ))}

                {isEnabled && candidates.length === 0 && (
                    <div className="text-muted-foreground rounded-xl border-2 border-dashed py-12 text-center italic">
                        {t("delegate.noCandidatesFound")}
                    </div>
                )}
            </div>
        </section>
    );
};
