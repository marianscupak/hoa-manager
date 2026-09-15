/**
 * Uppercases only the label's first character, leaving the rest untouched.
 *
 * The unit usage label has two sources: a translated string when the
 * cadastre's usage code is one the portal knows, or the cadastre's own
 * arbitrary Czech wording as a fallback (e.g. "jiný nebytový prostor") when
 * it is not. CSS `capitalize` title-cases every word — turning that
 * fallback into "Jiný Nebytový Prostor" — so the fix has to be a value
 * transform, not a class.
 */
export function capitalizeFirst(label: string): string {
    if (!label) return label;
    return label.charAt(0).toUpperCase() + label.slice(1);
}
