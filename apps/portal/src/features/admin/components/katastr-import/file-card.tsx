import { format } from "date-fns";
import { FileCode2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, Card } from "@hoa-mngr/ui";

import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

import { formatFileSize } from "./file-size";

/**
 * What was uploaded and what the extract says about itself. The admin has
 * to be able to tell at a glance that this is the right certificate before
 * reading anything below it, so the header fields sit above the diff
 * rather than under it.
 */
export function FileCard({
    file,
    document,
    onReplace,
    replaceDisabled,
}: {
    file: File;
    document: KatastrImportPreviewResponseDto["document"];
    onReplace: () => void;
    replaceDisabled: boolean;
}) {
    const { t } = useTranslation("katastr");
    const formatDate = (iso: string) => format(new Date(iso), "d. M. yyyy");

    const fields = [
        { label: t("document.lv"), value: document.lvNumber },
        { label: t("document.municipality"), value: document.municipality },
        { label: t("document.area"), value: document.cadastralArea },
        { label: t("document.validAt"), value: formatDate(document.validAt) },
        { label: t("document.issuedAt"), value: formatDate(document.issuedAt) },
    ];

    return (
        <Card className="px-[18px] py-4">
            <div className="flex items-center gap-3">
                <span
                    aria-hidden
                    className="bg-primary-tint text-primary-tint-foreground rounded-tile shadow-clay-inset flex h-[38px] w-[38px] shrink-0 items-center justify-center"
                >
                    <FileCode2Icon className="h-[17px] w-[17px]" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold">
                        {file.name}
                    </p>
                    <p className="text-muted-foreground text-[12.5px]">
                        {t("document.fileMeta", {
                            size: formatFileSize(file.size),
                        })}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-secondary-foreground h-8 shrink-0 px-3.5 text-[13px] shadow-none"
                    disabled={replaceDisabled}
                    onClick={onReplace}
                >
                    {t("document.replaceFile")}
                </Button>
            </div>

            <dl className="border-hairline mt-4 grid grid-cols-2 gap-x-[18px] gap-y-3.5 border-t pt-3.5 sm:grid-cols-3">
                {fields.map((field) => (
                    <div key={field.label}>
                        <dt className="text-faint text-2xs font-semibold tracking-[0.4px] uppercase">
                            {field.label}
                        </dt>
                        <dd className="mt-[3px] text-sm font-semibold tabular-nums">
                            {field.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </Card>
    );
}
