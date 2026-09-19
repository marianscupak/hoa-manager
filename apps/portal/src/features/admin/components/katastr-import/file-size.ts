const KB = 1024;
const MB = KB * KB;

/**
 * The size of the extract, for the line under its file name. One decimal
 * from a megabyte up, none below — the number is context, not a
 * measurement, and "1.4 MB" reads where "1,468,006 B" does not.
 */
export function formatFileSize(bytes: number): string {
    if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
    if (bytes >= KB) return `${Math.round(bytes / KB)} kB`;
    return `${bytes} B`;
}
