/**
 * Mirrors `MAX_UPLOAD_BYTES` in
 * apps/api/src/modules/core/property/api/katastr-import.controller.ts.
 * Nothing ties the two together — apps/portal and apps/api are separate
 * deployable apps, so a change to either constant needs a matching manual
 * edit on the other side. The same number is also duplicated as prose in
 * four places: `katastr:errors.FILE_TOO_LARGE` and
 * `katastr:dropzone.rejected.size`, in both cs and en. No test guards any
 * of this against drift.
 */
export const KATASTR_IMPORT_MAX_SIZE_BYTES = 8 * 1024 * 1024;

/**
 * `FileDropzone` matches a picked file's `accept.includes(file.type)`
 * against this list, and also uses it (joined) as the native file input's
 * `accept` attribute, which additionally understands bare extensions like
 * `.xml` for filtering the OS picker dialog.
 *
 * Some browsers and OS mime databases (Safari in particular) report an
 * empty `file.type` for a `.xml` file with no registered handler. `""` is
 * included here so that case is accepted rather than wrongly rejected
 * before the upload even starts — the API still parses and validates the
 * actual file content server-side regardless of what the browser claimed
 * its type was. It is listed *first*, not last: joined with `,` for the
 * native `accept` attribute, a leading empty token before a comma is
 * dropped by every engine's own comma-splitting, whereas a trailing empty
 * token (`"...,application/xml,"`, a dangling comma) is invalid input some
 * engines react to by disabling the filter entirely.
 */
export const KATASTR_IMPORT_ACCEPTED_CONTENT_TYPES: readonly string[] = [
    "",
    ".xml",
    "text/xml",
    "application/xml",
];
