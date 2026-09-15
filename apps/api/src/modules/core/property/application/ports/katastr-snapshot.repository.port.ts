import type { RegisterSnapshot } from '@/modules/core/property/domain/katastr/import-plan';

export interface KatastrSnapshotRepository {
  /**
   * Serialises imports for one tenant for the rest of the transaction. New
   * units do not exist yet, so per-unit `SELECT … FOR UPDATE` cannot cover
   * them; an import runs once at onboarding and occasionally after, so one gate
   * per house costs nothing.
   */
  lockTenant(tenantId: string): Promise<void>;
  /** Every unit with all its ownership periods, and every owner of the tenant. */
  load(tenantId: string): Promise<RegisterSnapshot>;
}

export const KATASTR_SNAPSHOT_REPOSITORY = Symbol(
  'KATASTR_SNAPSHOT_REPOSITORY',
);
