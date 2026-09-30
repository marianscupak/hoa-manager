import type { TFunction } from "i18next";

import { type ColumnDef, formatPercent, StatusChip } from "@hoa-mngr/ui";

import { TableDetailLink } from "@/components/table-detail-link";

import { type PersonRow } from "../utils/people-filter";
import { PersonStatusChip } from "./person-status-chip";

export interface PeopleColumnOptions {
    /** ADMIN and BOARD_MEMBER; a unit owner gets neither contact nor access. */
    canSeeAccounts: boolean;
}

export const getPeopleColumns = (
    t: TFunction<"admin">,
    { canSeeAccounts }: PeopleColumnOptions,
): ColumnDef<PersonRow>[] => [
    {
        id: "name",
        accessorKey: "displayName",
        header: t("people.table.name"),
        enableSorting: true,
        sortingFn: "localeNumeric",
        enableGlobalFilter: true,
        cell: ({ row }) => {
            const person = row.original;
            return (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate font-medium">
                        {person.displayName}
                    </span>
                    {person.kind && person.kind !== "PERSON" && (
                        <StatusChip variant="neutral" dot={false}>
                            {t(
                                `people.kind.${person.kind}` as "people.kind.ASSOCIATION",
                            )}
                        </StatusChip>
                    )}
                </div>
            );
        },
    },
    ...(canSeeAccounts
        ? [
              {
                  id: "email",
                  accessorFn: (row: PersonRow) => row.email ?? "",
                  header: t("people.table.email"),
                  enableSorting: false,
                  enableGlobalFilter: true,
                  cell: ({ row }: { row: { original: PersonRow } }) =>
                      row.original.email ? (
                          <span className="text-secondary-foreground truncate text-sm">
                              {row.original.email}
                          </span>
                      ) : (
                          <span className="text-faint">—</span>
                      ),
              } satisfies ColumnDef<PersonRow>,
          ]
        : []),
    {
        id: "holdings",
        accessorFn: (row) => row.unitCount,
        header: t("people.table.holdings"),
        enableSorting: true,
        enableGlobalFilter: false,
        // The unit count leads and the share sits under it. The units table
        // leads with the fraction, but there a row is one unit and the
        // fraction is what the association's documents state; a sum across
        // several units is a number nobody recognises.
        cell: ({ row }) => {
            const person = row.original;
            if (person.unitCount === 0) {
                return <span className="text-faint">—</span>;
            }
            return (
                <div>
                    <p className="font-semibold">
                        {t("people.table.unitCount", {
                            count: person.unitCount,
                        })}
                    </p>
                    <p className="text-muted-foreground text-xs">
                        {formatPercent(Number(person.sharePercent), 1)}
                    </p>
                </div>
            );
        },
    },
    ...(canSeeAccounts
        ? [
              {
                  id: "status",
                  header: t("people.table.status"),
                  enableSorting: false,
                  enableGlobalFilter: false,
                  cell: ({ row }: { row: { original: PersonRow } }) => (
                      <PersonStatusChip person={row.original} />
                  ),
              } satisfies ColumnDef<PersonRow>,
              {
                  id: "detail",
                  header: "",
                  enableSorting: false,
                  enableGlobalFilter: false,
                  meta: { align: "right" as const },
                  cell: ({ row }: { row: { original: PersonRow } }) => (
                      <TableDetailLink
                          to={`/people/${encodeURIComponent(row.original.key)}`}
                          label={t("people.table.detail")}
                      />
                  ),
              } satisfies ColumnDef<PersonRow>,
          ]
        : []),
];
