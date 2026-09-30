import { TFunction } from "i18next";
import { Trash2Icon } from "lucide-react";

import { Button, CellNumeric, StatusChip, type ColumnDef } from "@hoa-mngr/ui";

import type { UnitResponseDto } from "@/api/generated/model";
import { TableDetailLink } from "@/components/table-detail-link";

import { isCoOwnedShare, shareCellValues } from "../utils/shares";
import { unitUsageLabel } from "../utils/unit-usage";

type UnitRow = UnitResponseDto & { id: string };

export interface UnitColumnOptions {
    /** The board and the administrator edit and delete; everyone else reads. */
    canManage: boolean;
    /** Hidden when the reader owns nothing — an empty column explains nothing. */
    showMyShare: boolean;
    onDelete: (unit: UnitResponseDto) => void;
}

/**
 * Columns for the building's unit register — one table for the whole
 * association, growing with the reader's role.
 *
 * Who owns which unit and how large it is comes from the cadastre and the
 * prohlášení vlastníka, so every member reads the same rows; what the board
 * gets on top is the ability to change them. Every share leads with the
 * fraction and carries the percentage underneath, because the fraction is the
 * number the association's own documents state.
 */
export function getUnitColumns(
    /** From `useTranslation(["common", "admin"])`: the shared columns are
     *  named in `common`, the management bits in `admin`, and no key name
     *  appears in both. */
    t: TFunction<["common", "admin"]>,
    { canManage, showMyShare, onDelete }: UnitColumnOptions,
): ColumnDef<UnitRow>[] {
    return [
        {
            id: "unitNo",
            accessorKey: "unitNo",
            header: t("buildingUnits.table.unitNumber"),
            enableSorting: true,
            sortingFn: "localeNumeric",
            enableGlobalFilter: true,
            cell: ({ row }) => (
                <span className="text-foreground inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <span className="truncate">{row.original.unitNo}</span>
                    {row.original.mine && (
                        <StatusChip variant="primary" dot={false}>
                            {t("buildingUnits.table.mine")}
                        </StatusChip>
                    )}
                </span>
            ),
        },
        {
            id: "usage",
            header: t("buildingUnits.table.usage"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const label = unitUsageLabel(
                    t,
                    row.original.usageCode,
                    row.original.usageName,
                );
                return label ? (
                    <StatusChip variant="neutral" dot={false}>
                        {label}
                    </StatusChip>
                ) : (
                    <span className="text-faint text-detail">
                        {t("admin:units.table.usageUnknown")}
                    </span>
                );
            },
        },
        {
            id: "share",
            accessorFn: (row) =>
                row.buildingShareNumerator / row.buildingShareDenominator,
            header: t("buildingUnits.table.buildingShare"),
            enableSorting: true,
            sortDescFirst: true,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <CellNumeric
                    {...shareCellValues(
                        row.original.buildingShareNumerator,
                        row.original.buildingShareDenominator,
                    )}
                />
            ),
        },
        {
            id: "owners",
            accessorFn: (row) => row.owners.join(", "),
            header: t("buildingUnits.table.owners"),
            enableSorting: false,
            enableGlobalFilter: true,
            cell: ({ row }) =>
                row.original.owners.length > 0 ? (
                    <span className="text-secondary-foreground block truncate text-sm">
                        {row.original.owners.join(", ")}
                    </span>
                ) : (
                    <StatusChip variant="warning">
                        {t("buildingUnits.table.noOwner")}
                    </StatusChip>
                ),
        },
        ...(showMyShare
            ? [
                  {
                      id: "myShare",
                      header: t("buildingUnits.table.myShare"),
                      enableSorting: false,
                      enableGlobalFilter: false,
                      cell: ({ row }: { row: { original: UnitRow } }) => {
                          const unit = row.original;
                          if (
                              unit.myShareNumerator === null ||
                              unit.myShareDenominator === null
                          ) {
                              return <span className="text-faint">—</span>;
                          }
                          return (
                              <span className="inline-flex items-center gap-2">
                                  <CellNumeric
                                      {...shareCellValues(
                                          unit.myShareNumerator,
                                          unit.myShareDenominator,
                                      )}
                                  />
                                  {isCoOwnedShare(
                                      unit.myShareNumerator,
                                      unit.myShareDenominator,
                                  ) && (
                                      <StatusChip variant="warning">
                                          {t(
                                              "common:buildingUnits.table.coOwned",
                                          )}
                                      </StatusChip>
                                  )}
                              </span>
                          );
                      },
                  } satisfies ColumnDef<UnitRow>,
              ]
            : []),
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableGlobalFilter: false,
            meta: { align: "right" },
            cell: ({ row }) =>
                canManage ? (
                    <div className="flex items-center gap-1.5">
                        <TableDetailLink
                            to={`/units/${row.original.id}`}
                            label={t("buildingUnits.table.detail")}
                        />
                        <Button
                            variant="tableActionDanger"
                            size="tableIcon"
                            aria-label={t("admin:units.delete.title")}
                            onClick={() => onDelete(row.original)}
                        >
                            <Trash2Icon />
                        </Button>
                    </div>
                ) : row.original.mine ? (
                    // Only a unit the reader owns has a detail to open; the
                    // register says nothing more about anyone else's.
                    <TableDetailLink
                        to={`/units/${row.original.id}`}
                        label={t("buildingUnits.table.detail")}
                    />
                ) : null,
        },
    ];
}

/**
 * One track per column, in the same order. Kept next to `getUnitColumns` and
 * checked against it in the tests: the pair drifted once already, and the
 * action buttons ended up rendering under the unit number.
 */
export function unitsGridTemplate({
    canManage,
    showMyShare,
}: Pick<UnitColumnOptions, "canManage" | "showMyShare">): string {
    const base = "1.1fr 0.9fr 1.2fr 1.5fr";
    // "Detail ›" plus the delete icon, or "Detail ›" alone — the same button
    // the People table opens a person with.
    const actions = canManage ? "132px" : "96px";
    return showMyShare ? `${base} 1.3fr ${actions}` : `${base} ${actions}`;
}
