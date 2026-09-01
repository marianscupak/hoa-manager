/** Centered loading block for full-page loads. Tables and buttons keep
 *  their own in-place loading conventions. */
export function PageLoading({ label }: { label: string }) {
    return (
        <div className="text-muted-foreground px-8 py-16 text-center text-sm">
            {label}
        </div>
    );
}
