import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DataTable, StatusChip, type ColumnDef } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

import {
    buildImportRows,
    visibleImportRows,
    type ImportDetailPart,
    type ImportRow,
    type ImportRowAction,
} from "./import-rows";
import { TogglePill } from "./toggle-pill";

const ACTION_LABEL_KEY = {
    CREATE: "table.create",
    UPDATE: "table.update",
    UNCHANGED: "table.unchanged",
    NOT_IN_FILE: "table.notInFile",
} as const satisfies Record<ImportRowAction, string>;

const FIELD_LABEL_KEY = {
    unitNo: "table.field.unitNo",
    share: "table.field.share",
    usage: "table.field.usage",
    ownership: "table.field.ownership",
} as const satisfies Record<ImportDetailPart["field"], string>;

function ChangeChip({ action }: { action: ImportRowAction }) {
    const { t } = useTranslation("katastr");

    if (action === "NOT_IN_FILE") {
        return (
            <StatusChip
                variant="neutral"
                className="border-border bg-card text-muted-foreground border"
            >
                {t(ACTION_LABEL_KEY.NOT_IN_FILE)}
            </StatusChip>
        );
    }

    return (
        <StatusChip
            variant={
                action === "CREATE"
                    ? "success"
                    : action === "UPDATE"
                      ? "primary"
                      : "neutral"
            }
        >
            {t(ACTION_LABEL_KEY[action])}
        </StatusChip>
    );
}

/** A unit's changed fields, one line each, as "LABEL old → new". A row
 *  with nothing to change says so in words instead — a blank cell reads as
 *  missing data. */
function DetailCell({ row }: { row: ImportRow }) {
    const { t } = useTranslation("katastr");

    if (row.parts.length === 0) {
        return (
            <span className="text-muted-foreground text-detail">
                {row.action === "NOT_IN_FILE"
                    ? t("table.notInFileHint")
                    : t("table.noChange")}
            </span>
        );
    }

    return (
        <span className="flex flex-col gap-1">
            {row.parts.map((part) => (
                <span
                    key={part.field}
                    className="flex flex-wrap items-baseline gap-[7px] leading-[19px]"
                >
                    <span className="text-muted-foreground text-2xs font-semibold tracking-[0.4px] uppercase">
                        {t(FIELD_LABEL_KEY[part.field])}
                    </span>
                    {part.from !== null && (
                        <>
                            <span className="text-muted-foreground text-detail decoration-strike line-through">
                                {part.from}
                            </span>
                            <span aria-hidden className="text-faint text-xs">
                                →
                            </span>
                        </>
                    )}
                    <span className="text-detail font-semibold">{part.to}</span>
                </span>
            ))}
        </span>
    );
}

/**
 * What the import would do to each unit. Unchanged rows are the bulk of a
 * typical extract and are hidden until asked for, so the table opens on
 * the rows that need a decision.
 */
export function ImportUnitsTable({
    preview,
}: {
    preview: KatastrImportPreviewResponseDto;
}) {
    const { t } = useTranslation("katastr");
    const [showUnchanged, setShowUnchanged] = useState(false);

    const memberJoin = t("table.memberJoin");
    const rows = useMemo(
        () => buildImportRows(preview, memberJoin),
        [preview, memberJoin],
    );
    const visible = visibleImportRows(rows, showUnchanged);
    const unchangedCount = rows.filter(
        (row) => row.action === "UNCHANGED",
    ).length;

    const columns: ColumnDef<ImportRow>[] = [
        {
            id: "unitNo",
            accessorKey: "unitNo",
            header: t("table.unit"),
            enableGlobalFilter: true,
            enableSorting: false,
            // The Detail cell runs to several lines; without `self-start`
            // the unit number and its chip would float to the middle of
            // the row.
            meta: { className: "self-start" },
            cell: ({ row }) => (
                <span
                    className={cn(
                        "block truncate font-semibold",
                        // A unit the file does not mention is not part of
                        // the change; it reads as context, not as a row.
                        row.original.action === "NOT_IN_FILE" &&
                            "text-muted-foreground",
                    )}
                >
                    {row.original.unitNo}
                </span>
            ),
        },
        {
            id: "action",
            header: t("table.change"),
            enableGlobalFilter: false,
            enableSorting: false,
            meta: { className: "self-start" },
            cell: ({ row }) => <ChangeChip action={row.original.action} />,
        },
        {
            id: "detail",
            header: t("table.detail"),
            enableGlobalFilter: false,
            enableSorting: false,
            cell: ({ row }) => <DetailCell row={row.original} />,
        },
    ];

    return (
        <DataTable
            data={visible}
            columns={columns}
            gridTemplate="110px 128px minmax(0,1fr)"
            minWidth="520px"
            title={t("table.heading")}
            searchPlaceholder={t("table.searchPlaceholder")}
            // The designed order — creates, updates, unchanged, omitted —
            // is the only order, so the whole set stays on one page.
            pageSize={Number.MAX_SAFE_INTEGER}
            toolbarEnd={
                unchangedCount > 0 ? (
                    <TogglePill
                        active={showUnchanged}
                        onClick={() => setShowUnchanged((shown) => !shown)}
                    >
                        {showUnchanged
                            ? t("table.hideUnchanged", {
                                  count: unchangedCount,
                              })
                            : t("table.showUnchanged", {
                                  count: unchangedCount,
                              })}
                    </TogglePill>
                ) : undefined
            }
            emptyMessage={t("counts.nothingToDo")}
            emptySearchMessage={t("table.noMatch")}
            countLabel={(info) => t("table.count", { count: info.total })}
        />
    );
}
