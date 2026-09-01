/**
 * Pure logic for the DataTable component. Kept free of React and
 * TanStack imports so it can be unit-tested in a plain node environment.
 */

export function normalizeForSearch(value: string): string {
    return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function matchesSearch(value: unknown, query: string): boolean {
    if (value == null) return false;
    return normalizeForSearch(String(value)).includes(
        normalizeForSearch(query),
    );
}

export function localeNumericCompare(a: string, b: string): number {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
    });
}

export interface FooterInfo {
    from: number;
    to: number;
    total: number;
    paginated: boolean;
}

export function getFooterInfo(
    pageIndex: number,
    pageSize: number,
    total: number,
): FooterInfo {
    if (total === 0) return { from: 0, to: 0, total: 0, paginated: false };
    const paginated = total > pageSize;
    if (!paginated) return { from: 1, to: total, total, paginated };
    return {
        from: pageIndex * pageSize + 1,
        to: Math.min((pageIndex + 1) * pageSize, total),
        total,
        paginated,
    };
}
