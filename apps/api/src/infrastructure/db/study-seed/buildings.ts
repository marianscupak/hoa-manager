import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';

export const SHARE_DENOMINATOR = 10000;
export const PHASE_TWO_VOTE_KEY = 'oprava-vytahu';

export type PlanAnswer = 'YES' | 'NO' | 'ABSTAIN';

export interface PlanOwner {
  key: string;
  displayName: string;
  kind: OwnerKind;
  /** Gets a login + UNIT_OWNER membership so it can be a representative. */
  hasAccount: boolean;
  /** Linked to the persona user (Karel Malý) instead of a fresh account. */
  isPersona?: true;
  /** Display name and email come from the CLI; no account is created. */
  isParticipant?: true;
}

export interface PlanUnit {
  unitNo: string;
  shareNumerator: number; // over SHARE_DENOMINATOR
}

export interface PlanParty {
  unitNo: string;
  partyType: OwnershipPartyType;
  shareNumerator: number;
  shareDenominator: number;
  ownerKeys: string[];
}

export interface PlanBallot {
  ownerKey: string;
  unitNo: string;
  answer: PlanAnswer;
}

export type PlanVoteState =
  /** Phase 1 runs the whole lifecycle and backdates it into the past. */
  | { kind: 'CLOSED'; openedDaysAgo: number; closedDaysAgo: number }
  /** Phase 1 creates + schedules; the vote stays SCHEDULED (delegation target). */
  | { kind: 'SCHEDULED'; opensInDays: number; windowDays: number }
  /** Phase 1 creates + schedules; phase 2 backdates the start and opens it. */
  | {
      kind: 'OPEN_IN_PHASE_2';
      opensInDays: number;
      windowDays: number;
      openedDaysAgo: number;
    };

export interface PlanVote {
  key: string;
  title: string;
  description: string;
  questionTitle: string;
  state: PlanVoteState;
  ballots: PlanBallot[];
}

export interface BuildingPlan {
  key: 'B' | 'C';
  baseName: string;
  units: PlanUnit[];
  owners: PlanOwner[];
  parties: PlanParty[];
  votes: PlanVote[];
}

const person = (
  key: string,
  displayName: string,
  extra: Partial<PlanOwner> = {},
): PlanOwner => ({
  key,
  displayName,
  kind: OwnerKind.PERSON,
  hasAccount: true,
  ...extra,
});

const sole = (unitNo: string, ownerKey: string): PlanParty => ({
  unitNo,
  partyType: OwnershipPartyType.SOLE,
  shareNumerator: 1,
  shareDenominator: 1,
  ownerKeys: [ownerKey],
});

const sjm = (unitNo: string, a: string, b: string): PlanParty => ({
  unitNo,
  partyType: OwnershipPartyType.SJM,
  shareNumerator: 1,
  shareDenominator: 1,
  ownerKeys: [a, b],
});

/** Tenant B — admin track. Mirrors the building in seed.ts. */
export const SLUNECNA_12: BuildingPlan = {
  key: 'B',
  baseName: 'SVJ Slunečná 12',
  units: [
    { unitNo: '1', shareNumerator: 1712 },
    { unitNo: '2', shareNumerator: 1650 },
    { unitNo: '3', shareNumerator: 1500 },
    { unitNo: '4', shareNumerator: 1288 },
    { unitNo: '5', shareNumerator: 1200 },
    { unitNo: '6', shareNumerator: 1100 },
    { unitNo: '7', shareNumerator: 950 },
    { unitNo: '8', shareNumerator: 600 },
  ],
  owners: [
    person('jana', 'Jana Dvořáková'),
    person('petr', 'Petr Dvořák'),
    person('alena', 'Alena Svobodová'),
    person('tomas', 'Tomáš Novák'),
    {
      key: 'mesto',
      displayName: 'Město Příbram',
      kind: OwnerKind.LEGAL_ENTITY,
      hasAccount: false,
    },
    {
      key: 'svj',
      displayName: 'SVJ Slunečná 12',
      kind: OwnerKind.ASSOCIATION,
      hasAccount: false,
    },
    person('karel', 'Karel Malý', { isPersona: true }),
    person('eva', 'Eva Horáková'),
    person('josef', 'Josef Beneš'),
    person('marie', 'Marie Vlková'),
  ],
  parties: [
    sjm('1', 'jana', 'petr'),
    {
      unitNo: '2',
      partyType: OwnershipPartyType.SOLE,
      shareNumerator: 2,
      shareDenominator: 3,
      ownerKeys: ['alena'],
    },
    {
      unitNo: '2',
      partyType: OwnershipPartyType.SOLE,
      shareNumerator: 1,
      shareDenominator: 3,
      ownerKeys: ['tomas'],
    },
    sole('3', 'mesto'),
    sole('4', 'karel'),
    sole('5', 'eva'),
    sole('6', 'josef'),
    sole('7', 'marie'),
    sole('8', 'svj'),
  ],
  votes: [
    {
      key: 'vymena-oken',
      title: 'Výměna oken',
      description:
        'Výbor navrhuje výměnu původních dřevěných oken ve společných prostorách domu (schodiště, sklepy) za plastová s izolačním trojsklem. Nabídková cena 1 850 000 Kč vč. DPH, financování z fondu oprav.',
      questionTitle:
        'Souhlasíte s výměnou oken ve společných prostorách domu za nabídkovou cenu 1 850 000 Kč?',
      state: { kind: 'CLOSED', openedDaysAgo: 20, closedDaysAgo: 3 },
      ballots: [
        { ownerKey: 'karel', unitNo: '4', answer: 'YES' },
        { ownerKey: 'eva', unitNo: '5', answer: 'YES' },
        { ownerKey: 'josef', unitNo: '6', answer: 'YES' },
        { ownerKey: 'marie', unitNo: '7', answer: 'NO' },
      ],
    },
  ],
};

/** Tenant C — owner track. Names deliberately do not overlap with tenant B. */
export const JASMINOVA_3: BuildingPlan = {
  key: 'C',
  baseName: 'Bytový dům Jasmínová 3',
  units: [
    { unitNo: '1', shareNumerator: 2100 },
    { unitNo: '2', shareNumerator: 1900 },
    { unitNo: '3', shareNumerator: 1750 },
    { unitNo: '4', shareNumerator: 1650 },
    { unitNo: '5', shareNumerator: 1400 },
    { unitNo: '6', shareNumerator: 1200 },
  ],
  owners: [
    person('milan', 'Milan Procházka'),
    person('lenka', 'Lenka Marešová'),
    person('jiri', 'Jiří Kučera'),
    person('dana', 'Dana Kučerová'),
    person('participant', 'Účastník', { hasAccount: false, isParticipant: true }),
    person('hana', 'Hana Pokorná'),
    {
      key: 'delta',
      displayName: 'Firma Delta s.r.o.',
      kind: OwnerKind.LEGAL_ENTITY,
      hasAccount: false,
    },
  ],
  parties: [
    sole('1', 'milan'),
    sole('2', 'lenka'),
    sjm('3', 'jiri', 'dana'),
    sole('4', 'participant'),
    sole('5', 'hana'),
    sole('6', 'delta'),
  ],
  votes: [
    {
      key: PHASE_TWO_VOTE_KEY,
      title: 'Oprava výtahu',
      description:
        'Výtah opakovaně vypadává a servisní firma doporučuje výměnu pohonu a řídicí jednotky. Nabídka firmy Výtahy Novák s.r.o. činí 640 000 Kč vč. DPH.',
      questionTitle:
        'Souhlasíte s opravou výtahu podle nabídky firmy Výtahy Novák s.r.o. za 640 000 Kč?',
      state: {
        kind: 'OPEN_IN_PHASE_2',
        opensInDays: 1,
        windowDays: 16,
        openedDaysAgo: 2,
      },
      ballots: [
        { ownerKey: 'milan', unitNo: '1', answer: 'YES' },
        { ownerKey: 'hana', unitNo: '5', answer: 'YES' },
      ],
    },
    {
      key: 'novy-domovni-rad',
      title: 'Nový domovní řád',
      description:
        'Výbor předkládá ke schválení nový domovní řád, který upravuje noční klid, užívání společných prostor a pravidla pro chov zvířat.',
      questionTitle:
        'Schvalujete nový domovní řád ve znění předloženém výborem?',
      state: { kind: 'SCHEDULED', opensInDays: 3, windowDays: 17 },
      ballots: [],
    },
    {
      key: 'zatepleni-fasady',
      title: 'Zateplení fasády',
      description:
        'Zateplení obvodového pláště domu včetně nové fasády. Cena dle výběrového řízení 3 200 000 Kč vč. DPH, financování z fondu oprav a úvěru.',
      questionTitle:
        'Souhlasíte se zateplením fasády domu za 3 200 000 Kč s financováním z fondu oprav a úvěru?',
      state: { kind: 'CLOSED', openedDaysAgo: 25, closedDaysAgo: 5 },
      ballots: [
        { ownerKey: 'milan', unitNo: '1', answer: 'YES' },
        { ownerKey: 'lenka', unitNo: '2', answer: 'YES' },
        { ownerKey: 'hana', unitNo: '5', answer: 'YES' },
      ],
    },
  ],
};

/**
 * Mirrors `computeVoteResults` for SIMPLE_MAJORITY over ALL_VOTES with
 * UNIT_SHARE weight: association-owned units drop out of the denominator,
 * everything else counts, and the bar is strictly more than one half.
 */
export function planTally(
  plan: BuildingPlan,
  voteKey: string,
): { yes: number; no: number; countable: number; passes: boolean } {
  const vote = plan.votes.find((v) => v.key === voteKey);
  if (!vote) throw new Error(`Unknown vote "${voteKey}" in plan ${plan.key}`);

  const ownerKind = new Map(plan.owners.map((o) => [o.key, o.kind]));
  const associationUnits = new Set(
    plan.parties
      .filter((p) =>
        p.ownerKeys.some((k) => ownerKind.get(k) === OwnerKind.ASSOCIATION),
      )
      .map((p) => p.unitNo),
  );
  const share = new Map(plan.units.map((u) => [u.unitNo, u.shareNumerator]));

  const countable = plan.units
    .filter((u) => !associationUnits.has(u.unitNo))
    .reduce((a, u) => a + u.shareNumerator, 0);
  const sum = (answer: PlanAnswer) =>
    vote.ballots
      .filter((b) => b.answer === answer && !associationUnits.has(b.unitNo))
      .reduce((a, b) => a + (share.get(b.unitNo) ?? 0), 0);

  const yes = sum('YES');
  const no = sum('NO');
  return { yes, no, countable, passes: yes * 2 > countable };
}
