import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Input,
    toast,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { showApiError } from "@/api/error-utils";
import { getPeopleControllerGetPeopleQueryKey } from "@/api/generated/people/people";
import { useOwnerControllerLinkAccount } from "@/api/generated/property-owners/property-owners";
import { matchesSearch } from "@hoa-mngr/ui";

import { type PersonRow } from "../utils/people-filter";

interface LinkAccountDialogProps {
    /** The owner being linked; null closes the dialog. */
    owner: PersonRow | null;
    /** Everyone in the association, to pick the account out of. */
    people: PersonRow[];
    onOpenChange: (open: boolean) => void;
}

/**
 * Picks the account that acts for an owner.
 *
 * A searchable list rather than a confirm on the suggestion, because the
 * suggestion mostly will not exist: it needs a matching e-mail, and the
 * katastr import produces owners without one. The suggestion, when there is
 * one, only preselects.
 */
export function LinkAccountDialog({
    owner,
    people,
    onOpenChange,
}: LinkAccountDialogProps) {
    const { t } = useTranslation(["admin"]);
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [picked, setPicked] = useState<string | null>(null);

    const link = useOwnerControllerLinkAccount({
        mutation: {
            onSuccess: () => {
                toast.success(t("people.link.success"));
                void queryClient.invalidateQueries({
                    queryKey: getPeopleControllerGetPeopleQueryKey(),
                });
                onOpenChange(false);
            },
            onError: showApiError,
        },
    });

    // Only rows that are an account and nothing else: an account already
    // standing for an owner would be refused by the unique index anyway.
    const candidates = useMemo(
        () =>
            people.filter(
                (p) => p.source === "MEMBER" && p.membershipId !== null,
            ),
        [people],
    );

    const visible = search
        ? candidates.filter(
              (p) =>
                  matchesSearch(p.displayName, search) ||
                  matchesSearch(p.email ?? "", search),
          )
        : candidates;

    const selected =
        picked ??
        candidates.find((c) => c.key === owner?.suggestedCounterpartKey)
            ?.membershipId ??
        null;

    return (
        <Dialog
            open={owner !== null}
            onOpenChange={(open) => {
                if (!open) {
                    setSearch("");
                    setPicked(null);
                }
                onOpenChange(open);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("people.link.title")}</DialogTitle>
                    <DialogDescription>
                        {t("people.link.body")}
                    </DialogDescription>
                </DialogHeader>

                {candidates.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-sm">
                        {t("people.link.empty")}
                    </p>
                ) : (
                    <>
                        <div className="relative">
                            <Search className="text-faint absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t("people.link.search")}
                                className="h-9 pl-9"
                            />
                        </div>

                        <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                            {visible.map((candidate) => (
                                <button
                                    key={candidate.key}
                                    type="button"
                                    onClick={() =>
                                        setPicked(candidate.membershipId)
                                    }
                                    className={cn(
                                        "w-full cursor-pointer rounded-xl border-2 p-3 px-3.5 text-left transition-colors",
                                        candidate.membershipId === selected
                                            ? "border-primary bg-primary-tint/40"
                                            : "border-border bg-card hover:bg-accent",
                                    )}
                                >
                                    <p className="text-sm font-semibold">
                                        {candidate.displayName}
                                        {candidate.key ===
                                            owner?.suggestedCounterpartKey && (
                                            <span className="text-primary ml-2 text-xs font-medium">
                                                {t("people.link.suggested")}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {candidate.email}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t("people.link.cancel")}
                    </Button>
                    <Button
                        disabled={
                            !selected || !owner?.ownerId || link.isPending
                        }
                        onClick={() => {
                            if (!selected || !owner?.ownerId) return;
                            link.mutate({
                                ownerId: owner.ownerId,
                                data: { membershipId: selected },
                            });
                        }}
                    >
                        {t("people.link.confirm")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
