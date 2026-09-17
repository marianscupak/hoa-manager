import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfDay } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Form,
    FormDatePicker,
    StatusChip,
    toast,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { useUnitControllerUpdateOwnershipPeriod } from "@/api/generated/property-units/property-units";

import { affectedVotesFrom, type AffectedVote } from "./affected-votes";

const schema = z
    .object({
        validFrom: z.date(),
        validTo: z.date().nullable(),
    })
    .refine((v) => v.validTo === null || v.validTo > v.validFrom, {
        path: ["validTo"],
        message: "admin:units.details.ownership.editPeriod.endBeforeStart",
    });

type UpdatePeriodValues = z.infer<typeof schema>;

interface UpdatePeriodDialogProps {
    unitId: string;
    /** The period being moved, as it stands now. */
    period: { validFrom: string; validTo: string | null } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

/**
 * Moves the bounds of an ownership period that is already on the register —
 * including closing an open one, which leaves the unit without an owner from
 * that day.
 *
 * The API refuses the first attempt when the move reaches a vote and answers
 * with the list; the board sees it and decides. That is deliberate: the
 * register is theirs to correct, and the app's job is to make the cost
 * visible rather than to forbid the correction.
 */
export function UpdatePeriodDialog({
    unitId,
    period,
    open,
    onOpenChange,
    onSuccess,
}: UpdatePeriodDialogProps) {
    const { t } = useTranslation(["admin"]);
    const [affected, setAffected] = useState<AffectedVote[] | null>(null);

    const form = useForm<UpdatePeriodValues>({
        resolver: zodResolver(schema),
        defaultValues: { validFrom: startOfDay(new Date()), validTo: null },
    });

    useEffect(() => {
        if (!open || !period) return;
        setAffected(null);
        form.reset({
            validFrom: startOfDay(new Date(period.validFrom)),
            validTo: period.validTo
                ? startOfDay(new Date(period.validTo))
                : null,
        });
    }, [open, period, form]);

    const updatePeriod = useUnitControllerUpdateOwnershipPeriod({
        mutation: {
            onSuccess: () => {
                toast.success(t("units.details.ownership.editPeriod.success"));
                onOpenChange(false);
                onSuccess?.();
            },
            onError: (error) => {
                const votes = affectedVotesFrom(error);
                // Not a refusal about votes — an overlap, say — so it reads
                // as an ordinary error.
                if (votes === null) return showApiError(error);
                setAffected(votes);
            },
        },
    });

    const submit = (values: UpdatePeriodValues, acknowledged: boolean) => {
        if (!period) return;
        updatePeriod.mutate({
            id: unitId,
            data: {
                periodValidFrom: format(
                    startOfDay(new Date(period.validFrom)),
                    "yyyy-MM-dd",
                ),
                validFrom: format(values.validFrom, "yyyy-MM-dd"),
                ...(values.validTo
                    ? { validTo: format(values.validTo, "yyyy-MM-dd") }
                    : {}),
                acknowledged,
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t("units.details.ownership.editPeriod.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("units.details.ownership.editPeriod.description")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((values) =>
                            submit(values, affected !== null),
                        )}
                        className="space-y-4"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormDatePicker
                                name="validFrom"
                                label={t(
                                    "units.details.ownership.editPeriod.fromLabel",
                                )}
                            />
                            <FormDatePicker
                                name="validTo"
                                optional
                                label={t(
                                    "units.details.ownership.editPeriod.toLabel",
                                )}
                                description={t(
                                    "units.details.ownership.editPeriod.toHint",
                                )}
                            />
                        </div>

                        {affected !== null && (
                            <div className="border-border bg-muted/60 space-y-3 rounded-xl border p-4">
                                <p className="text-sm font-semibold">
                                    {t(
                                        "units.details.ownership.editPeriod.affectedTitle",
                                        { count: affected.length },
                                    )}
                                </p>
                                <ul className="space-y-2">
                                    {affected.map((vote) => (
                                        <li
                                            key={vote.voteId}
                                            className="flex items-center justify-between gap-3 text-sm"
                                        >
                                            <span className="truncate">
                                                {vote.title}
                                            </span>
                                            <StatusChip
                                                variant={
                                                    vote.impact === "LIVE"
                                                        ? "primary"
                                                        : "neutral"
                                                }
                                                dot={false}
                                            >
                                                {t(
                                                    `units.details.ownership.editPeriod.impact.${vote.impact}`,
                                                )}
                                            </StatusChip>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-muted-foreground text-detail">
                                    {t(
                                        "units.details.ownership.editPeriod.affectedHint",
                                    )}
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={updatePeriod.isPending}
                            >
                                {updatePeriod.isPending
                                    ? t(
                                          "units.details.ownership.editPeriod.submitting",
                                      )
                                    : affected !== null
                                      ? t(
                                            "units.details.ownership.editPeriod.confirm",
                                        )
                                      : t(
                                            "units.details.ownership.editPeriod.submit",
                                        )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
