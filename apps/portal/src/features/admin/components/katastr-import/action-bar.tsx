import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

/**
 * Cancel and Confirm, pinned to the bottom of the viewport. The preview
 * runs to several screens on a real building, and the whole point of the
 * screen is the decision at the end of it — the buttons have to be in
 * reach from wherever the admin has read to.
 *
 * `notice` carries an apply-time error (a stale plan, a re-surfaced
 * blocker) so it appears with the action it belongs to rather than
 * scrolled off above the fold.
 */
export function ActionBar({
    counts,
    blockerCount,
    notice,
    cancelDisabled,
    confirmDisabled,
    onCancel,
    onConfirm,
}: {
    counts: KatastrImportPreviewResponseDto["counts"];
    blockerCount: number;
    notice?: ReactNode;
    cancelDisabled: boolean;
    confirmDisabled: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const { t } = useTranslation("katastr");
    const isBlocked = blockerCount > 0;

    return (
        <div className="border-border bg-card/92 sticky bottom-0 z-10 -mx-4 border-t px-4 py-3.5 backdrop-blur-md md:-mx-8 md:px-8">
            {notice && <div className="mb-3">{notice}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3.5">
                <p
                    className={cn(
                        "max-w-[480px] text-[13px] leading-[18px]",
                        isBlocked
                            ? "text-destructive-muted-foreground"
                            : "text-muted-foreground",
                    )}
                >
                    {isBlocked
                        ? t("actionBar.blocked", { count: blockerCount })
                        : t("actionBar.summary", {
                              unitsCreated: counts.unitsCreated,
                              unitsUpdated: counts.unitsUpdated,
                              ownersCreated: counts.ownersCreated,
                          })}
                </p>
                <div className="flex items-center gap-2.5">
                    <Button
                        variant="outline"
                        disabled={cancelDisabled}
                        onClick={onCancel}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        className="disabled:shadow-none"
                        disabled={confirmDisabled}
                        onClick={onConfirm}
                    >
                        {t("confirm")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
