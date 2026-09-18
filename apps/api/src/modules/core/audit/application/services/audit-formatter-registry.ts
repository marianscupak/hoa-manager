import { Injectable } from '@nestjs/common';

import type {
  AuditEventFormatter,
  TimelineEntry,
  ViewerContext,
} from './audit-event-formatter';
import type { AuditEventReadRecord } from '../ports/audit-event-read.repository.port';

@Injectable()
export class AuditFormatterRegistry {
  private readonly formatters = new Map<string, AuditEventFormatter>();

  register(formatter: AuditEventFormatter): void {
    if (this.formatters.has(formatter.module)) {
      throw new Error(
        `AuditFormatterRegistry: duplicate registration for module '${formatter.module}'`,
      );
    }
    this.formatters.set(formatter.module, formatter);
  }

  format(event: AuditEventReadRecord, viewer: ViewerContext): TimelineEntry {
    const formatter = this.formatters.get(event.module);
    if (formatter) {
      return formatter.format(event, viewer);
    }
    return this.fallback(event);
  }

  formatMany(
    events: AuditEventReadRecord[],
    viewer: ViewerContext,
  ): TimelineEntry[] {
    return events.map((e) => this.format(e, viewer));
  }

  private fallback(event: AuditEventReadRecord): TimelineEntry {
    return {
      id: event.id,
      occurredAt: event.occurredAt.toISOString(),
      eventType: event.eventType,
      // Raw event type as message — the i18n layer can decide what to do.
      message: event.eventType,
      navigateTo: null,
    };
  }
}
