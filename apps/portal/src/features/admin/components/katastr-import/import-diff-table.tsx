import { useTranslation } from "react-i18next";

import { DataTable, type ColumnDef } from "@hoa-mngr/ui";

import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

type PreviewUnit = KatastrImportPreviewResponseDto["units"][number];

interface Row {
    id: string;
    unitNo: string;
    action: PreviewUnit["action"] | "NOT_IN_FILE";
    detail: string;
}

export function ImportDiffTable({
    preview,
}: {
    preview: KatastrImportPreviewResponseDto;
}) {
    const { t } = useTranslation("katastr");

    const describe = (unit: PreviewUnit): string => {
        const parts: string[] = [];
        if (unit.unitNoChange) {
            parts.push(t("table.unitNoChange", unit.unitNoChange));
        }
        if (unit.shareChange) {
            parts.push(t("table.shareChange", unit.shareChange));
        }
        if (unit.usageChange) {
            parts.push(
                t("table.usageChange", {
                    from: unit.usageChange.from ?? "—",
                    to: unit.usageChange.to ?? "—",
                }),
            );
        }
        if (unit.ownershipChange) {
            const show = (
                parties: { memberNames: string[]; share: string }[],
            ) =>
                parties
                    .map((p) => `${p.memberNames.join(" a ")} (${p.share})`)
                    .join(", ");
            parts.push(
                unit.ownershipChange.from.length === 0
                    ? t("table.newOwnership", {
                          to: show(unit.ownershipChange.to),
                      })
                    : t("table.ownershipChange", {
                          from: show(unit.ownershipChange.from),
                          to: show(unit.ownershipChange.to),
                      }),
            );
        }
        return parts.join(" · ");
    };

    const rows: Row[] = [
        ...preview.units.map((unit) => ({
            id: unit.unitNo,
            unitNo: unit.unitNo,
            action: unit.action,
            detail: describe(unit),
        })),
        ...preview.unitsNotInFile.map((unit) => ({
            id: unit.unitNo,
            unitNo: unit.unitNo,
            action: "NOT_IN_FILE" as const,
            detail: t("table.notInFileHint"),
        })),
    ];

    const label: Record<Row["action"], string> = {
        CREATE: t("table.create"),
        UPDATE: t("table.update"),
        UNCHANGED: t("table.unchanged"),
        NOT_IN_FILE: t("table.notInFile"),
    };

    const columns: ColumnDef<Row>[] = [
        {
            id: "unitNo",
            accessorKey: "unitNo",
            header: t("table.unit"),
            enableGlobalFilter: true,
        },
        {
            id: "action",
            header: t("table.change"),
            enableGlobalFilter: false,
            cell: ({ row }) => label[row.original.action],
        },
        {
            id: "detail",
            accessorKey: "detail",
            header: "",
            enableGlobalFilter: false,
        },
    ];

    return (
        <DataTable
            data={rows}
            columns={columns}
            gridTemplate="140px 160px 1fr"
            emptyMessage={t("counts.nothingToDo")}
            countLabel={(info) => t("table.count", { count: info.total })}
        />
    );
}
