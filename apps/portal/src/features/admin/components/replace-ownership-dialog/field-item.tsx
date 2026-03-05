import { Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, FormInput, FormSelect } from "@hoa-mngr/ui";

interface ReplaceOwnershipFieldItemProps {
    index: number;
    ownerOptions: { label: string; value: string }[];
    onRemove: (index: number) => void;
    canRemove: boolean;
}

export function ReplaceOwnershipFieldItem({
    index,
    ownerOptions,
    onRemove,
    canRemove,
}: ReplaceOwnershipFieldItemProps) {
    const { t } = useTranslation(["admin"]);

    return (
        <div className="border-border bg-muted/60 hover:border-primary/30 flex items-start gap-4 rounded-xl border p-4 transition-colors">
            <div className="flex-1">
                <FormSelect
                    name={`ownerships.${index}.ownerId`}
                    label={t("units.ownershipEditor.ownerLabel")}
                    placeholder={t("units.ownershipEditor.ownerPlaceholder")}
                    options={ownerOptions}
                />
            </div>

            <div className="w-32">
                <FormInput
                    name={`ownerships.${index}.share`}
                    label={t("units.ownershipEditor.shareLabel")}
                    placeholder="0.5"
                />
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive mt-5"
                onClick={() => onRemove(index)}
                disabled={!canRemove}
            >
                <Trash2Icon className="h-4 w-4" />
            </Button>
        </div>
    );
}
