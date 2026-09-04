/**
 * `mailto:` for the "contact the chair" link: every address as a recipient,
 * the vote title pre-filled as subject. `null` when there is nobody to write
 * to, so the caller can hide the link instead of rendering a dead one.
 */
export function buildContactMailto(
    emails: string[],
    subject: string,
): string | null {
    if (emails.length === 0) return null;
    return `mailto:${emails.join(",")}?subject=${encodeURIComponent(subject)}`;
}
