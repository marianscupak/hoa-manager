import { describe, expect, it } from 'vitest';
import { ASSEMBLY_PRESET, PER_ROLLAM_PRESET, tierIssues } from './ruleset-legal';

describe('ruleset-legal', () => {
  it('both presets are clean for their mode', () => {
    expect(tierIssues('PER_ROLLAM', PER_ROLLAM_PRESET)).toEqual({ tier1: [], tier3: [] });
    expect(tierIssues('ASSEMBLY_RECORD', ASSEMBLY_PRESET)).toEqual({ tier1: [], tier3: [] });
  });
  it('flags a lowered assembly quorum', () => {
    const bad = { ...ASSEMBLY_PRESET, quorum: { ...ASSEMBLY_PRESET.quorum!, threshold: { num: 3, den: 10 } } };
    expect(tierIssues('ASSEMBLY_RECORD', bad).tier1[0].code).toBe('ASSEMBLY_QUORUM_BELOW_FLOOR');
  });
  it('flags one-unit-one-vote as tier 3', () => {
    expect(tierIssues('PER_ROLLAM', { ...PER_ROLLAM_PRESET, weightBasis: 'ONE_UNIT_ONE_VOTE' }).tier3).toEqual(['ONE_UNIT_ONE_VOTE']);
  });
});
