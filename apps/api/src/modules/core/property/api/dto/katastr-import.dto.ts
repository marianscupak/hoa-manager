import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import type { ImportPlan } from '@/modules/core/property/domain/katastr/import-plan';
import { formatAssociationDate } from '@/shared/domain/association-date';

export const previewKatastrImportSchema = z.object({
  effectiveAt: z
    .string()
    .date()
    .optional()
    .describe('Effective date for ownership changes; defaults to ct:platnost'),
});

export class PreviewKatastrImportDto extends createZodDto(
  previewKatastrImportSchema,
) {}

export const applyKatastrImportSchema = z.object({
  effectiveAt: z.string().date(),
  planHash: z
    .string()
    .min(1)
    .describe('The planHash returned by the preview the admin confirmed'),
});

export class ApplyKatastrImportDto extends createZodDto(
  applyKatastrImportSchema,
) {}

const partySummarySchema = z.object({
  partyType: z.enum(['SOLE', 'SJM']),
  share: z.string(),
  memberNames: z.array(z.string()),
});

const changeSchema = z.object({ from: z.string(), to: z.string() });

const countsSchema = z.object({
  unitsCreated: z.number().int(),
  unitsUpdated: z.number().int(),
  unitsUnchanged: z.number().int(),
  ownersCreated: z.number().int(),
  ownersMatched: z.number().int(),
});

export const katastrImportPreviewSchema = z.object({
  planHash: z.string(),
  effectiveAt: z.string(),
  document: z.object({
    validAt: z.string(),
    issuedAt: z.string(),
    lvNumber: z.string(),
    municipality: z.string(),
    cadastralArea: z.string(),
  }),
  counts: countsSchema,
  units: z.array(
    z.object({
      unitNo: z.string(),
      action: z.enum(['CREATE', 'UPDATE', 'UNCHANGED']),
      unitNoChange: changeSchema.nullable(),
      shareChange: changeSchema.nullable(),
      usageChange: z
        .object({ from: z.string().nullable(), to: z.string().nullable() })
        .nullable(),
      ownershipChange: z
        .object({
          from: z.array(partySummarySchema),
          to: z.array(partySummarySchema),
        })
        .nullable(),
    }),
  ),
  owners: z.array(
    z.object({
      displayName: z.string(),
      ico: z.string().nullable(),
      kind: z.enum(['PERSON', 'LEGAL_ENTITY', 'ASSOCIATION']),
      action: z.enum([
        'CREATE',
        'MATCHED_BY_KATASTR_ID',
        'MATCHED_BY_ICO',
        'MATCHED_BY_NAME',
      ]),
      existingDisplayName: z.string().nullable(),
      existingEmail: z.string().nullable(),
      existingHasAccount: z.boolean(),
    }),
  ),
  unitsNotInFile: z.array(z.object({ unitNo: z.string() })),
  ownersNotInFile: z.array(z.object({ displayName: z.string() })),
  /** Discriminated on `code`; the portal switches on it for the message. */
  warnings: z.array(z.looseObject({ code: z.string() })),
  blockers: z.array(z.looseObject({ code: z.string() })),
});

export class KatastrImportPreviewResponseDto extends createZodDto(
  katastrImportPreviewSchema,
) {}

export const katastrImportResultSchema = z.object({
  counts: countsSchema,
  effectiveAt: z.string(),
});

export class KatastrImportResultResponseDto extends createZodDto(
  katastrImportResultSchema,
) {}

export function planCounts(plan: ImportPlan): z.infer<typeof countsSchema> {
  const units = (action: string) =>
    plan.units.filter((u) => u.action === action).length;
  return {
    unitsCreated: units('CREATE'),
    unitsUpdated: units('UPDATE'),
    unitsUnchanged: units('UNCHANGED'),
    ownersCreated: plan.owners.filter((o) => o.action === 'CREATE').length,
    ownersMatched: plan.owners.filter((o) => o.action !== 'CREATE').length,
  };
}

export function toPreviewResponse(
  plan: ImportPlan,
  planHash: string,
): z.infer<typeof katastrImportPreviewSchema> {
  return {
    planHash,
    // A YYYY-MM-DD calendar day, not the instant it is midnight at — that
    // is what this field means (the admin picks a day in a <input
    // type="date">), and it is what ApplyKatastrImportDto's effectiveAt
    // (z.string().date()) expects back unchanged. Returning the instant
    // here made the portal's own day-reduction (`.slice(0, 10)` on an ISO
    // string) walk the date back by one in every zone west of UTC.
    effectiveAt: formatAssociationDate(plan.effectiveAt),
    document: {
      validAt: plan.document.validAt.toISOString(),
      issuedAt: plan.document.issuedAt.toISOString(),
      lvNumber: plan.document.lvNumber,
      municipality: plan.document.municipality,
      cadastralArea: plan.document.cadastralArea,
    },
    counts: planCounts(plan),
    units: plan.units.map((u) => ({
      unitNo: u.unitNo,
      action: u.action,
      unitNoChange: u.unitNoChange,
      shareChange: u.shareChange,
      usageChange: u.usageChange,
      ownershipChange: u.ownershipChange,
    })),
    owners: plan.owners.map((o) => ({
      displayName: o.displayName,
      ico: o.ico,
      kind: o.kind,
      action: o.action,
      existingDisplayName: o.existingDisplayName,
      existingEmail: o.existingEmail,
      existingHasAccount: o.existingHasAccount,
    })),
    unitsNotInFile: plan.unitsNotInFile.map((u) => ({ unitNo: u.unitNo })),
    ownersNotInFile: plan.ownersNotInFile.map((o) => ({
      displayName: o.displayName,
    })),
    warnings: plan.warnings,
    blockers: plan.blockers,
  };
}
