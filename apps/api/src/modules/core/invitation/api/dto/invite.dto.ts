import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { InviteStatus } from '@/modules/core/invitation/domain/invite-status';

export class SendOwnerInviteResponseDto {
  @ApiProperty()
  success!: boolean;
}

export const getInviteStatusSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export class GetInviteStatusDto extends createZodDto(getInviteStatusSchema) {}

export class InviteStatusResponseDto {
  @ApiProperty({ enum: ['valid', 'expired', 'accepted', 'not_found'] })
  status!: InviteStatus;

  @ApiProperty({ nullable: true, type: String, required: false })
  emailMasked?: string;

  @ApiProperty({ nullable: true, type: Date, required: false })
  expiresAt?: Date;
}

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export class AcceptInviteDto extends createZodDto(acceptInviteSchema) {}

export class AcceptInviteResponseDto {
  @ApiProperty()
  tenantId!: string;
}

export const registerFromInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export class RegisterFromInviteDto extends createZodDto(
  registerFromInviteSchema,
) {}

export class RegisterFromInviteResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  tenantId!: string;
}
