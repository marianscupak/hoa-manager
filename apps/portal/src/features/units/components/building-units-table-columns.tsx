import { TFunction } from "i18next";
import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

import { Button, CellNumeric, StatusChip, type ColumnDef } from "@hoa-mngr/ui";

import type { UnitResponseDto } from "@/api/generated/model";

import { isCoOwnedShare, shareCellValues } from "../utils/shares";

/**
 * Columns for the building's unit register, as an owner reads it.
 *
 * The whole house is listed — who owns which unit and how large it is comes
 * from the cadastre and the prohlášení vlastníka — with the reader's own units
 * marked, because in a fifty-unit building those are what they came for.
 *
 * Every share leads with the fraction and carries the percentage underneath:
 * the fraction is the number the association's documents state. The
 * percentages are recomputed from the fractions rather than read from the
 * API's rounded fields, so the two values on screen always agree.
 */
export function getBuildingUnitColumns(
    t: TFunction<"common">,
    /** Hidden when the reader owns nothing — an empty column explains nothing. */
    showMyShare: boolean,
): ColumnDef<UnitResponseDto & { id: string }>[] {
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
                        <StatusChip variant="primary">
                            {t("buildingUnits.table.mine")}
                        </StatusChip>
                    )}
                </span>
            ),
        },
        {
            id: "usage",
            accessorFn: (row) => row.usageName ?? "",
            header: t("buildingUnits.table.usage"),
            enableSorting: false,
            enableGlobalFilter: true,
            cell: ({ row }) =>
                row.original.usageName ?? <span className="text-faint">—</span>,
        },
        {
            id: "buildingShare",
            header: t("buildingUnits.table.buildingShare"),
            enableSorting: false,
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
                    <span className="text-faint text-sm">
                        {t("buildingUnits.table.noOwner")}
                    </span>
                ),
        },
        ...(showMyShare
            ? [
                  {
                      id: "myShare",
                      header: t("buildingUnits.table.myShare"),
                      enableSorting: false,
                      enableGlobalFilter: false,
                      cell: ({
                          row,
                      }: {
                          row: { original: UnitResponseDto };
                      }) => {
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
                                          {t("buildingUnits.table.coOwned")}
                                      </StatusChip>
                                  )}
                              </span>
                          );
                      },
                  } satisfies ColumnDef<UnitResponseDto & { id: string }>,
              ]
            : []),
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableGlobalFilter: false,
            meta: { align: "right" },
            // Only a unit the reader owns has a detail to open; the register
            // says nothing more about anyone else's.
            cell: ({ row }) =>
                row.original.mine ? (
                    <Button variant="tableAction" size="tableIcon" asChild>
                        <Link
                            to={`/units/${row.original.id}`}
                            aria-label={t("buildingUnits.table.openDetail", {
                                unitNo: row.original.unitNo,
                            })}
                        >
                            <ChevronRightIcon />
                        </Link>
                    </Button>
                ) : null,
        },
    ];
}
