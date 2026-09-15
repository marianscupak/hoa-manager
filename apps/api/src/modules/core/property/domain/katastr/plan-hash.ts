import { createHash } from 'node:crypto';

import type { ImportPlan } from '@/modules/core/property/domain/katastr/import-plan';

/** JSON that survives bigint shares and Date fields deterministically. */
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, v) => {
    if (typeof v === 'bigint') return v.toString();
    if (v instanceof Date) return v.toISOString();
    return v;
  });

/** SHA-256 of the uploaded file alone; recorded in the audit event. */
export function computeFileHash(fileContent: string): string {
  return createHash('sha256').update(fileContent, 'utf8').digest('hex');
}

/**
 * Ties a confirmation to exactly what the admin previewed: the file bytes, the
 * plan derived from them, and the effective date. A different file, a different
 * date, or a register edited in between all change this value.
 */
export function computePlanHash(fileContent: string, plan: ImportPlan): string {
  return createHash('sha256')
    .update(computeFileHash(fileContent))
    .update(':')
    .update(canonical(plan))
    .digest('hex');
}
