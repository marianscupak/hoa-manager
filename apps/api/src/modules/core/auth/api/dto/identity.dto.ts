import { ApiProperty } from '@nestjs/swagger';

export class IdentityResponseDto {
  @ApiProperty({
    description: 'How the account can sign in',
    enum: ['LOCAL', 'OIDC_GOOGLE'],
    example: 'OIDC_GOOGLE',
  })
  provider!: 'LOCAL' | 'OIDC_GOOGLE';

  @ApiProperty({
    description: 'When this method was last used to sign in',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  lastUsedAt!: string | null;
}

export class GoogleLinkStartResponseDto {
  @ApiProperty({
    description: 'Where to send the browser to authorise with Google',
    example: 'https://accounts.google.com/o/oauth2/v2/auth?...',
  })
  redirectUrl!: string;
}
