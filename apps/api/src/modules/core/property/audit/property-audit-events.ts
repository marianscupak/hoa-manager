import { KatastrDataImportedAuditEvent } from './events/katastr-data-imported.event';
import { OwnerCreatedAuditEvent } from './events/owner-created.event';
import { OwnerDeletedAuditEvent } from './events/owner-deleted.event';
import { OwnerEmailAddedAuditEvent } from './events/owner-email-added.event';
import { OwnerRenamedAuditEvent } from './events/owner-renamed.event';
import { OwnerUserLinkedAuditEvent } from './events/owner-user-linked.event';
import { OwnerUserUnlinkedAuditEvent } from './events/owner-user-unlinked.event';
import { UnitCreatedAuditEvent } from './events/unit-created.event';
import { UnitDeletedAuditEvent } from './events/unit-deleted.event';
import { UnitOwnershipReplacedAuditEvent } from './events/unit-ownership-replaced.event';
import { UnitOwnershipTransferCancelledAuditEvent } from './events/unit-ownership-transfer-cancelled.event';
import { UnitUpdatedAuditEvent } from './events/unit-updated.event';

export const PROPERTY_AUDIT_EVENTS = [
  UnitCreatedAuditEvent,
  UnitUpdatedAuditEvent,
  UnitDeletedAuditEvent,
  OwnerCreatedAuditEvent,
  OwnerDeletedAuditEvent,
  UnitOwnershipReplacedAuditEvent,
  UnitOwnershipTransferCancelledAuditEvent,
  OwnerUserLinkedAuditEvent,
  OwnerUserUnlinkedAuditEvent,
  OwnerEmailAddedAuditEvent,
  OwnerRenamedAuditEvent,
  KatastrDataImportedAuditEvent,
];
