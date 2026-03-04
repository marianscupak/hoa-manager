import * as React from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./table";

export interface ColumnDef<TData> {
    header: React.ReactNode;
    accessorKey?: keyof TData;
    cell?: (props: { row: TData }) => React.ReactNode;
    className?: string;
}

export interface DataTableProps<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
    isLoading?: boolean;
    emptyMessage?: string;
}

export function DataTable<TData>({
    columns,
    data,
    isLoading,
    emptyMessage = "No results.",
}: DataTableProps<TData>) {
    return (
        <div className="bg-card rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col, i) => (
                            <TableHead key={i} className={col.className}>
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                Loading...
                            </TableCell>
                        </TableRow>
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="text-muted-foreground h-24 text-center"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {columns.map((col, colIndex) => {
                                    let content: React.ReactNode = null;
                                    if (col.cell) {
                                        content = col.cell({ row });
                                    } else if (col.accessorKey) {
                                        content = String(
                                            row[col.accessorKey] ?? "",
                                        );
                                    }
                                    return (
                                        <TableCell
                                            key={colIndex}
                                            className={col.className}
                                        >
                                            {content}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
