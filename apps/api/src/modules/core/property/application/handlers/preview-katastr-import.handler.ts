import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  KatastrImportPreviewResponseDto,
  toPreviewResponse,
} from '@/modules/core/property/api/dto/katastr-import.dto';
import {
  KATASTR_SNAPSHOT_REPOSITORY,
  type KatastrSnapshotRepository,
} from '@/modules/core/property/application/ports/katastr-snapshot.repository.port';
import { PreviewKatastrImportQuery } from '@/modules/core/property/application/queries/preview-katastr-import.query';
import { buildImportPlan } from '@/modules/core/property/domain/katastr/build-import-plan';
import { parseKatastrDocument } from '@/modules/core/property/domain/katastr/parse-katastr-document';
import { computePlanHash } from '@/modules/core/property/domain/katastr/plan-hash';
import { KatastrFileRejectedException } from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  formatAssociationDate,
  parseAssociationDate,
} from '@/shared/domain/association-date';

@QueryHandler(PreviewKatastrImportQuery)
export class PreviewKatastrImportHandler
  implements
    IQueryHandler<PreviewKatastrImportQuery, KatastrImportPreviewResponseDto>
{
  constructor(
    @Inject(KATASTR_SNAPSHOT_REPOSITORY)
    private readonly snapshots: KatastrSnapshotRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(
    query: PreviewKatastrImportQuery,
  ): Promise<KatastrImportPreviewResponseDto> {
    const parsed = parseKatastrDocument(query.xml);
    if (!parsed.ok) throw new KatastrFileRejectedException(parsed.errors);

    const now = this.clock.now();
    const snapshot = await this.snapshots.load(query.tenantId);
    // ct:platnost carries a time-of-day that is a batch-run artefact and means
    // nothing (see the sample extract's 00:15:02); when no explicit date was
    // given, the default is the Prague calendar day it falls on, at local
    // midnight — the same instant a manual ownership transfer on that same
    // calendar day would use. formatAssociationDate always returns a real
    // calendar day for a real Date, so parseAssociationDate cannot fail here.
    const effectiveAt =
      query.effectiveAt ??
      parseAssociationDate(formatAssociationDate(parsed.document.validAt))!;

    const plan = buildImportPlan(parsed.document, snapshot, effectiveAt, now);
    // Parser warnings belong to the plan the admin confirms, so they are part
    // of the hash as well as the response.
    plan.warnings.unshift(...parsed.warnings);

    return toPreviewResponse(plan, computePlanHash(query.xml, plan));
  }
}
