import {
  generatePassword,
  normalizeParticipantId,
  participantTag,
  personaEmail,
  slugify,
  studyEmail,
  studyEmailLikePattern,
  tenantName,
} from './naming';

describe('naming', () => {
  it('normalizes participant ids to upper case', () => {
    expect(normalizeParticipantId('p3')).toBe('P3');
    expect(normalizeParticipantId(' P12 ')).toBe('P12');
  });

  it('rejects malformed participant ids', () => {
    for (const bad of ['P', 'P123', 'X3', '3', 'P-1', '']) {
      expect(() => normalizeParticipantId(bad)).toThrow(/participant id/i);
    }
  });

  it('builds tags and tenant names', () => {
    expect(participantTag('P3')).toBe('[P3]');
    expect(tenantName('SVJ Slunečná 12', 'P3')).toBe('SVJ Slunečná 12 [P3]');
  });

  it('slugifies Czech names to ascii dot-separated tokens', () => {
    expect(slugify('Lenka Marešová')).toBe('lenka.maresova');
    expect(slugify('Ing. Pavel Král')).toBe('ing.pavel.kral');
    expect(slugify('Firma Delta s.r.o.')).toBe('firma.delta.s.r.o');
  });

  it('builds study emails under the study domain', () => {
    expect(studyEmail('P3', 'vybor')).toBe('p3.vybor@study.hoa.local');
    expect(personaEmail('P10')).toBe('p10.vybor@study.hoa.local');
  });

  it('builds a LIKE pattern that cannot match another participant', () => {
    expect(studyEmailLikePattern('P1')).toBe('p1.%@study.hoa.local');
    // "p10.x@…" must not match "p1.%@…" — the dot after the id guarantees it
    expect('p10.milan@study.hoa.local'.startsWith('p1.')).toBe(false);
  });

  it('generates a typeable password without ambiguous characters', () => {
    const pw = generatePassword();
    expect(pw).toMatch(/^Svj-[a-km-np-zA-HJ-NP-Z2-9]{4}-[a-km-np-zA-HJ-NP-Z2-9]{4}$/);
    expect(pw).not.toMatch(/[0O1lI]/);
  });

  it('is deterministic given an injected random source', () => {
    const zero = () => 0;
    expect(generatePassword(zero)).toBe('Svj-aaaa-aaaa');
  });
});
