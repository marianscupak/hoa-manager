import { CheckIcon } from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@hoa-mngr/ui/lib/utils";

export type KatastrImportStep = "file" | "preview" | "done";

const STEPS = [
    "file",
    "preview",
    "done",
] as const satisfies readonly KatastrImportStep[];

const STEP_LABEL_KEY = {
    file: "steps.file",
    preview: "steps.preview",
    done: "steps.done",
} as const satisfies Record<KatastrImportStep, string>;

/**
 * Where the admin is in the three-step import. Purely an orientation aid —
 * the pills are not navigation, because the only way back to an earlier
 * step is to replace the file or cancel, both of which have their own
 * control.
 */
export function StepPills({ current }: { current: KatastrImportStep }) {
    const { t } = useTranslation("katastr");
    const currentIndex = STEPS.indexOf(current);

    return (
        <ol className="flex flex-wrap items-center gap-1.5">
            {STEPS.map((step, index) => {
                const state =
                    index < currentIndex
                        ? "done"
                        : index === currentIndex
                          ? "current"
                          : "upcoming";
                return (
                    <Fragment key={step}>
                        {index > 0 && (
                            <li aria-hidden className="bg-border h-px w-3.5" />
                        )}
                        <li
                            aria-current={
                                state === "current" ? "step" : undefined
                            }
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-[13px] py-[5px] text-[12.5px] font-semibold",
                                state === "done" &&
                                    "bg-muted text-secondary-foreground",
                                state === "current" &&
                                    "bg-primary text-primary-foreground shadow-clay-btn-sm px-[15px] font-bold",
                                state === "upcoming" && "bg-muted text-faint",
                            )}
                        >
                            {state === "done" && (
                                <CheckIcon
                                    aria-hidden
                                    className="h-[13px] w-[13px]"
                                    strokeWidth={2.5}
                                />
                            )}
                            {t(STEP_LABEL_KEY[step])}
                        </li>
                    </Fragment>
                );
            })}
        </ol>
    );
}
