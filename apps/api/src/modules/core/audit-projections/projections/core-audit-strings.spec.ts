import { STRINGS } from './core-audit-strings';

describe('core-audit-strings', () => {
  // A key present in `en` but missing in `cs` (or vice versa) is invisible at
  // runtime: t() falls back through STRINGS[lang][key] ?? STRINGS.en[key] ??
  // STRINGS.en.unknown, so a Czech viewer silently gets the English sentence
  // instead of a test failure or a visible raw key. This test reads the
  // locale objects directly so a fallback cannot hide a gap.
  it('has the same keys in both languages', () => {
    expect(Object.keys(STRINGS.cs).sort()).toEqual(
      Object.keys(STRINGS.en).sort(),
    );
  });
});
