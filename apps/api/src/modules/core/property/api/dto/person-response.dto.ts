import { ApiProperty } from '@nestjs/swagger';

/**
 * One person connected to the association — an owner, an account, or both.
 *
 * Fields a caller may not see are null rather than omitted from the type, and
 * the server is what decides: a screen that merely hides a column still ships
 * every neighbour's e-mail address to the browser.
 */
export class PersonResponseDto {
  /** `owner:<id>` or `member:<id>` — the two sources share no key. */
  @ApiProperty()
  key!: string;

  @ApiProperty({ enum: ['OWNER', 'MEMBER'] })
  source!: 'OWNER' | 'MEMBER';

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ type: 'string', nullable: true })
  email!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  ownerId!: string | null;

  @ApiProperty({
    enum: ['PERSON', 'LEGAL_ENTITY', 'ASSOCIATION'],
    nullable: true,
  })
  kind!: 'PERSON' | 'LEGAL_ENTITY' | 'ASSOCIATION' | null;

  @ApiProperty({ type: 'string', nullable: true })
  ico!: string | null;

  @ApiProperty()
  unitCount!: number;

  /**
   * Share of the building's common parts, as a percentage with two decimals.
   *
   * Not a fraction: summing several units multiplies the denominators, which
   * passes `Number.MAX_SAFE_INTEGER` by the fourth unit in a real building,
   * and this screen deliberately does not show the fraction anyway. The
   * arithmetic is exact `Rational` work; only the rendering is decimal.
   */
  @ApiProperty()
  sharePercent!: string;

  @ApiProperty()
  hasOwnershipRecords!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  membershipId!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  userId!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  role!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  status!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  joinedAt!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  inviteStatus!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  inviteCreatedAt!: string | null;

  /** The counterpart that looks like the same person, by e-mail. */
  @ApiProperty({ type: 'string', nullable: true })
  suggestedCounterpartKey!: string | null;

  /**
   * The address the linked account signs in with — unlike `email`, which on
   * an owner row is the board's contact for that owner.
   */
  @ApiProperty({ type: 'string', nullable: true })
  accountEmail!: string | null;
}
