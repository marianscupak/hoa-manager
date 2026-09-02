/**
 * Brand tokens for email.
 *
 * Colours mirror the `@theme` tokens in packages/ui/globals.css.
 * theme.spec.ts fails when they drift. Email clients do not support
 * CSS variables, so the values are literal hex strings.
 */
export const colors = {
    /** --color-background */
    background: "#f8fafc",
    /** --color-card */
    card: "#ffffff",
    /** --color-foreground */
    foreground: "#0f172a",
    /** --color-secondary-foreground — body copy */
    secondaryForeground: "#475569",
    /** --color-muted-foreground — footer, hints */
    mutedForeground: "#64748b",
    /** --color-border */
    border: "#e2e8f0",
    /** --color-primary — button, wordmark, links */
    primary: "#7c3aed",
} as const;

/** Email-only values with no app counterpart. */
export const fonts = {
    display:
        '"Nunito", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

/** Pixel radii. */
export const radii = { button: 8, card: 12 } as const;

/** Pixel sizes. */
export const layout = { maxWidth: 600, cardPadding: 32 } as const;

/** Same string as the portal's <title>. The envelope sender name stays in EMAIL_FROM_NAME. */
export const PRODUCT_NAME = "HOA Manager";
