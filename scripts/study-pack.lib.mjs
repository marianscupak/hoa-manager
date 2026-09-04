/**
 * Pure helpers for the study pack generator (scripts/study-pack.mjs).
 *
 * Kept free of file and browser access so the parsing rules that decide what
 * a participant ends up reading are unit-tested (scripts/study-pack.test.mjs).
 */

const PARTICIPANT_ID_PATTERN = /^P\d{1,2}$/;
const PLACEHOLDER_PATTERN = /<<([^<>]+)>>/g;
const STUDY_EMAIL_DOMAIN = "study.hoa";

/** Mirrors normalizeParticipantId in apps/api/.../study-seed/naming.ts. */
export function normalizeParticipantId(raw) {
    const id = String(raw ?? "")
        .trim()
        .toUpperCase();
    if (!PARTICIPANT_ID_PATTERN.test(id)) {
        throw new Error(
            `Invalid participant id "${raw}": expected P0-P99 (e.g. --participant P3)`,
        );
    }
    return id;
}

/** Mirrors personaEmail in apps/api/.../study-seed/naming.ts. */
export function personaEmail(participantId) {
    return `${normalizeParticipantId(participantId).toLowerCase()}.vybor@${STUDY_EMAIL_DOMAIN}`;
}

/**
 * Replaces every `<<placeholder>>` that has a value and reports the rest, so
 * the caller can refuse to hand a half-filled document to a participant.
 */
export function substitute(text, values) {
    const unresolved = new Set();
    const filled = text.replace(PLACEHOLDER_PATTERN, (match, key) => {
        const name = key.trim();
        const value = Object.prototype.hasOwnProperty.call(values, name)
            ? values[name]
            : undefined;
        if (value === undefined || value === null || value === "") {
            unresolved.add(name);
            return match;
        }
        return String(value);
    });
    return {
        text: filled,
        unresolved: [...unresolved].sort((a, b) => a.localeCompare(b, "cs")),
    };
}

const startsWithHeading = (line, heading) =>
    line.trimStart().startsWith(heading);

/**
 * Returns the lines from `fromHeading` (inclusive) to `toHeading` (exclusive).
 * Both headings must exist: a typo must fail loudly rather than silently widen
 * the slice, because these slices are what keeps moderator-only material
 * (SUS scoring, interpretation) out of participant-facing documents.
 */
export function extractSection(markdown, fromHeading, toHeading) {
    const lines = markdown.split("\n");
    const start = lines.findIndex((line) =>
        startsWithHeading(line, fromHeading),
    );
    if (start === -1) {
        throw new Error(`Section "${fromHeading}" not found`);
    }
    const offset = lines
        .slice(start + 1)
        .findIndex((line) => startsWithHeading(line, toHeading));
    if (offset === -1) {
        throw new Error(
            `Section "${toHeading}" not found after "${fromHeading}"`,
        );
    }
    return `${lines
        .slice(start, start + 1 + offset)
        .join("\n")
        .replace(/\s+$/, "")}\n`;
}

/** Returns the contents of the first fenced block below `afterHeading`. */
export function extractFencedBlock(markdown, afterHeading) {
    const lines = markdown.split("\n");
    const start = lines.findIndex((line) =>
        startsWithHeading(line, afterHeading),
    );
    if (start === -1) {
        throw new Error(`Heading "${afterHeading}" not found`);
    }

    let open = -1;
    for (let i = start + 1; i < lines.length; i += 1) {
        const line = lines[i].trim();
        if (line.startsWith("```")) {
            open = i;
            break;
        }
        if (line.startsWith("## ")) {
            break;
        }
    }
    if (open === -1) {
        throw new Error(`No fenced block after "${afterHeading}"`);
    }

    const close = lines.findIndex(
        (line, i) => i > open && line.trim().startsWith("```"),
    );
    if (close === -1) {
        throw new Error(`Unterminated fenced block after "${afterHeading}"`);
    }
    return lines
        .slice(open + 1, close)
        .join("\n")
        .replace(/\s+$/, "");
}

/**
 * Turns the plain-text participant card from the moderator script into
 * structure the renderer can lay out: a title, then sections of label/value
 * rows plus any free-standing note lines.
 */
export function parseCard(block) {
    const lines = block.split("\n").map((line) => line.replace(/\s+$/, ""));

    let cursor = 0;
    while (cursor < lines.length && lines[cursor].trim() === "") {
        cursor += 1;
    }
    const title = cursor < lines.length ? lines[cursor].trim() : "";
    cursor += 1;

    const sections = [];
    let current = { heading: null, rows: [], notes: [] };
    const flush = () => {
        const hasContent =
            current.heading !== null ||
            current.rows.length > 0 ||
            current.notes.length > 0;
        if (hasContent) {
            sections.push(current);
        }
    };

    for (; cursor < lines.length; cursor += 1) {
        const line = lines[cursor].trim();
        if (line === "") {
            continue;
        }
        if (/^ČÁST\b/u.test(line)) {
            flush();
            current = { heading: line, rows: [], notes: [] };
            continue;
        }
        const separator = line.indexOf(":");
        if (separator > 0) {
            current.rows.push({
                label: line.slice(0, separator).trim(),
                value: line
                    .slice(separator + 1)
                    .trim()
                    .replace(/\s{2,}/g, " "),
            });
            continue;
        }
        current.notes.push(line);
    }
    flush();

    return { title, sections };
}
