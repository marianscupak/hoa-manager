import type { ClsService } from 'nestjs-cls';

import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { AUDIT_CLS_KEYS } from '@/modules/core/audit/infrastructure/cls/audit-context.keys';

import { AuditContextService } from './audit-context.service';

function makeClsStub(actor: AuditActor | undefined): ClsService {
  return {
    get: jest.fn((key: string) =>
      key === AUDIT_CLS_KEYS.actor ? actor : undefined,
    ),
  } as unknown as ClsService;
}

describe('AuditContextService.requireActor', () => {
  it('returns the actor when one is set in CLS', () => {
    const actor: AuditActor = {
      type: 'USER',
      userId: 'user-1',
      membershipId: 'm-1',
    };
    const service = new AuditContextService(makeClsStub(actor));

    expect(service.requireActor()).toEqual(actor);
  });

  it('throws when no actor is in CLS', () => {
    const service = new AuditContextService(makeClsStub(undefined));

    expect(() => service.requireActor()).toThrow();
  });

  it('throw message mentions SystemActorRunner to guide developers', () => {
    const service = new AuditContextService(makeClsStub(undefined));

    expect(() => service.requireActor()).toThrow(/SystemActorRunner/);
  });
});
