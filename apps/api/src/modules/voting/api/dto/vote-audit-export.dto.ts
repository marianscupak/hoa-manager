import { ApiProperty } from '@nestjs/swagger';

export class VoteAuditExportDto {
  @ApiProperty() exportMeta!: {
    schemaVersion: '1.0';
    exportedAt: string;
    exportedByMembershipId: string;
    exportedByLabel: string;
    tenantId: string;
    tenantName: string;
  };

  @ApiProperty({ type: Object }) vote!: Record<string, unknown>;
  @ApiProperty({ type: Object }) electorateSnapshot!: Record<string, unknown>;
  @ApiProperty({ required: false, type: Object })
  results?: Record<string, unknown> | null;
  @ApiProperty({ type: [Object] }) auditEvents!: Record<string, unknown>[];
}
