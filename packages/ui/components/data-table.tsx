import {
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ExpandedState,
    type Row,
    type RowData,
    type SortingFn,
    type SortingState,
} from "@tanstack/react-table";
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    SearchIcon,
} from "lucide-react";
import * as React from "react";

import {
    getFooterInfo,
    localeNumericCompare,
    matchesSearch,
    type FooterInfo,
} from "../lib/data-table-logic";
import { cn } from "../lib/utils";

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        align?: "right";
        className?: string;
    }
    interface SortingFns {
        localeNumeric: SortingFn<unknown>;
    }
}

export type { ColumnDef, SortingState };

export interface DataTableProps<TData extends { id: string }> {
    columns: ColumnDef<TData>[];
    data: TData[];
    /** Shared grid template for header + rows, e.g. "1.9fr 1.1fr 118px 140px" */
    gridTemplate: string;
    isLoading?: boolean;
    loadingMessage?: string;
    /** Shown when the table has no rows at all. */
    emptyMessage: string;
    /** Shown when a search query matches nothing; falls back to emptyMessage. */
    emptySearchMessage?: string;
    /** Heading shown at the start of the toolbar, before the search field. */
    title?: string;
    /** Omit to hide the search field. */
    searchPlaceholder?: string;
    /** Extra toolbar content, right-aligned (e.g. a filter select). */
    toolbarEnd?: React.ReactNode;
    /**
     * Width below which the rows scroll sideways instead of squeezing, e.g.
     * `"900px"`. Omit and the table behaves as it always has: the columns
     * shrink to whatever space there is.
     *
     * The toolbar and the footer stay put — only the header row and the rows
     * move, so the search box and the pager never slide out of reach.
     */
    minWidth?: string;
    pageSize?: number;
    zebra?: boolean;
    initialSorting?: SortingState;
    /** Footer text; check info.paginated to choose range vs plain count. */
    countLabel: (info: FooterInfo) => string;
    /** Aria labels for the prev/next pager buttons. */
    paginationLabels?: { previous: string; next: string };
    /** Enables per-row expansion. Omit (with renderSubRow) for the plain
     *  table — behaviour is then unchanged. */
    getRowCanExpand?: (row: TData) => boolean;
    /** Content rendered beneath an expanded row, spanning the full width. */
    renderSubRow?: (row: TData) => React.ReactNode;
    /** Accessible label builder for the expander, e.g.
     *  `(row) => t("expand", { unitNo: row.unitNo })`. */
    expandRowLabel?: (row: TData) => string;
    /** Accessible label builder for an expanded row's collapse action. */
    collapseRowLabel?: (row: TData) => string;
}

function diacriticGlobalFilter<TData>(
    row: Row<TData>,
    columnId: string,
    filterValue: string,
): boolean {
    return matchesSearch(row.getValue(columnId), filterValue);
}

/** Stable identity for the empty case. TanStack v8 recomputes row models
 *  on every new array reference; a fresh `[]` per render (e.g. `data ?? []`
 *  while loading) combined with autoResetPageIndex causes render loops. */
const EMPTY_DATA: never[] = [];

export function DataTable<TData extends { id: string }>({
    columns,
    data,
    gridTemplate,
    isLoading,
    loadingMessage,
    emptyMessage,
    emptySearchMessage,
    title,
    searchPlaceholder,
    toolbarEnd,
    minWidth,
    pageSize = 10,
    zebra = true,
    initialSorting,
    countLabel,
    paginationLabels,
    getRowCanExpand,
    renderSubRow,
    expandRowLabel,
    collapseRowLabel,
}: DataTableProps<TData>) {
    const [sorting, setSorting] = React.useState<SortingState>(
        initialSorting ?? [],
    );
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize,
    });
    const [expanded, setExpanded] = React.useState<ExpandedState>({});

    const table = useReactTable({
        data: data.length === 0 ? (EMPTY_DATA as TData[]) : data,
        columns,
        state: { sorting, globalFilter, pagination, expanded },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: getRowCanExpand
            ? (row) => getRowCanExpand(row.original)
            : undefined,
        globalFilterFn: diacriticGlobalFilter,
        getColumnCanGlobalFilter: (column) =>
            column.columnDef.enableGlobalFilter === true,
        sortingFns: {
            localeNumeric: (rowA, rowB, columnId) =>
                localeNumericCompare(
                    String(rowA.getValue(columnId) ?? ""),
                    String(rowB.getValue(columnId) ?? ""),
                ),
        },
        enableSortingRemoval: false,
        autoResetPageIndex: true,
        getRowId: (row) => row.id,
    });

    const rows = table.getRowModel().rows;
    const total = table.getFilteredRowModel().rows.length;
    const footer = getFooterInfo(
        pagination.pageIndex,
        pagination.pageSize,
        total,
    );
    const pageCount = table.getPageCount();

    const headers = table.getHeaderGroups()[0]?.headers ?? [];

    return (
        <div
            role="table"
            className="bg-card rounded-card shadow-clay-card overflow-hidden border"
        >
            {(title || searchPlaceholder || toolbarEnd) && (
                <div className="border-hairline flex flex-wrap items-center gap-3 border-b px-4 py-3">
                    {title && (
                        <h2 className="text-md font-bold tracking-[-0.1px]">
                            {title}
                        </h2>
                    )}
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                        {searchPlaceholder ? (
                            <div className="bg-background border-border relative h-[34px] w-full max-w-[300px] rounded-full border">
                                <SearchIcon className="text-faint pointer-events-none absolute top-1/2 left-[13px] h-3.5 w-3.5 -translate-y-1/2" />
                                <input
                                    type="search"
                                    value={globalFilter}
                                    onChange={(e) =>
                                        setGlobalFilter(e.target.value)
                                    }
                                    placeholder={searchPlaceholder}
                                    aria-label={searchPlaceholder}
                                    className="placeholder:text-faint focus-visible:ring-ring text-detail h-full w-full rounded-full bg-transparent pr-[13px] pl-9 focus-visible:ring-2 focus-visible:outline-none"
                                />
                            </div>
                        ) : (
                            <div />
                        )}
                        {toolbarEnd}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <div style={minWidth ? { minWidth } : undefined}>
                    <div
                        role="row"
                        className="bg-background border-hairline grid items-center gap-3 border-b px-5 py-[9px]"
                        style={{ gridTemplateColumns: gridTemplate }}
                    >
                        {headers.map((header) => {
                            const canSort = header.column.getCanSort();
                            const sorted = header.column.getIsSorted();
                            const align = header.column.columnDef.meta?.align;
                            const label = header.isPlaceholder
                                ? null
                                : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                  );
                            return (
                                <div
                                    role="columnheader"
                                    aria-sort={
                                        sorted === "asc"
                                            ? "ascending"
                                            : sorted === "desc"
                                              ? "descending"
                                              : undefined
                                    }
                                    key={header.id}
                                    className={cn(
                                        "min-w-0",
                                        align === "right" && "flex justify-end",
                                    )}
                                >
                                    {canSort ? (
                                        <button
                                            type="button"
                                            onClick={header.column.getToggleSortingHandler()}
                                            className={cn(
                                                "focus-visible:ring-ring inline-flex cursor-pointer items-center gap-2 text-xs font-semibold tracking-[0.3px] uppercase focus-visible:ring-2 focus-visible:outline-none",
                                                sorted
                                                    ? "text-primary-hover font-bold"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {label}
                                            {sorted && (
                                                // Deliberate off-scale size: decorative sort-direction glyph, not readable text.
                                                <span
                                                    aria-hidden
                                                    className="text-[8px] leading-none"
                                                >
                                                    {sorted === "asc"
                                                        ? "▲"
                                                        : "▼"}
                                                </span>
                                            )}
                                        </button>
                                    ) : (
                                        <span className="text-muted-foreground text-xs font-semibold tracking-[0.3px] uppercase">
                                            {label}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div>
                        {isLoading ? (
                            <div className="text-muted-foreground text-detail px-5 py-8 text-center">
                                {loadingMessage ?? "…"}
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="text-muted-foreground text-detail px-5 py-8 text-center">
                                {globalFilter
                                    ? emptySearchMessage ?? emptyMessage
                                    : emptyMessage}
                            </div>
                        ) : (
                            rows.map((row, rowIndex) => {
                                const canExpand =
                                    !!renderSubRow && row.getCanExpand();
                                const isExpanded =
                                    canExpand && row.getIsExpanded();
                                return (
                                    <React.Fragment key={row.id}>
                                        <div
                                            role="row"
                                            className={cn(
                                                "border-hairline hover:bg-muted grid items-center gap-3 border-b px-5 py-[9px] text-sm",
                                                !isExpanded &&
                                                    "last:border-b-0",
                                                zebra &&
                                                    rowIndex % 2 === 0 &&
                                                    "bg-surface-zebra",
                                            )}
                                            style={{
                                                gridTemplateColumns:
                                                    gridTemplate,
                                            }}
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <div
                                                        role="cell"
                                                        key={cell.id}
                                                        className={cn(
                                                            "min-w-0",
                                                            cell.column
                                                                .columnDef.meta
                                                                ?.align ===
                                                                "right" &&
                                                                "flex justify-end",
                                                            cell.column
                                                                .columnDef.meta
                                                                ?.className,
                                                        )}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </div>
                                                ))}
                                            {renderSubRow && (
                                                <div
                                                    role="cell"
                                                    className="flex justify-end"
                                                >
                                                    {canExpand && (
                                                        <button
                                                            type="button"
                                                            aria-expanded={
                                                                isExpanded
                                                            }
                                                            aria-label={
                                                                isExpanded
                                                                    ? collapseRowLabel?.(
                                                                          row.original,
                                                                      )
                                                                    : expandRowLabel?.(
                                                                          row.original,
                                                                      )
                                                            }
                                                            onClick={row.getToggleExpandedHandler()}
                                                            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"
                                                        >
                                                            <ChevronDownIcon
                                                                className={cn(
                                                                    "h-4 w-4 motion-safe:transition-transform",
                                                                    isExpanded &&
                                                                        "rotate-180",
                                                                )}
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {isExpanded && (
                                            <div
                                                role="region"
                                                className="border-hairline bg-background border-b px-5 py-3 last:border-b-0"
                                            >
                                                {renderSubRow(row.original)}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-background border-hairline flex items-center justify-between gap-3 border-t py-[9px] pr-3.5 pl-5">
                <span className="text-muted-foreground text-detail">
                    {isLoading ? null : countLabel(footer)}
                </span>
                {footer.paginated && (
                    <div className="flex items-center gap-1.5">
                        <PagerButton
                            aria-label={
                                paginationLabels?.previous ?? "Previous page"
                            }
                            disabled={!table.getCanPreviousPage()}
                            onClick={() => table.previousPage()}
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </PagerButton>
                        {Array.from({ length: pageCount }, (_, i) => (
                            <PagerButton
                                key={i}
                                aria-current={
                                    pagination.pageIndex === i
                                        ? "page"
                                        : undefined
                                }
                                active={pagination.pageIndex === i}
                                onClick={() => table.setPageIndex(i)}
                            >
                                {i + 1}
                            </PagerButton>
                        ))}
                        <PagerButton
                            aria-label={paginationLabels?.next ?? "Next page"}
                            disabled={!table.getCanNextPage()}
                            onClick={() => table.nextPage()}
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </PagerButton>
                    </div>
                )}
            </div>
        </div>
    );
}

function PagerButton({
    active,
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
    return (
        <button
            type="button"
            className={cn(
                "border-border bg-card text-secondary-foreground hover:bg-muted focus-visible:ring-ring text-detail flex h-[30px] min-w-[30px] cursor-pointer items-center justify-center rounded-lg border px-1 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default disabled:opacity-40",
                active &&
                    "bg-primary border-primary text-primary-foreground hover:bg-primary shadow-clay-btn-sm font-bold",
                className,
            )}
            {...props}
        />
    );
}
