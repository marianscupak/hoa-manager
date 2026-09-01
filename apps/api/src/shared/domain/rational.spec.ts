import { Rational } from './rational';

describe('Rational', () => {
  it('normalizes via gcd and keeps den positive', () => {
    const r = Rational.from(50000000, 100000000);
    expect(r.num).toBe(1n);
    expect(r.den).toBe(2n);
  });

  it('rejects zero denominator and negative values', () => {
    expect(() => Rational.from(1, 0)).toThrow();
    expect(() => Rational.from(-1, 2)).toThrow();
  });

  it('adds exactly: 1/3 + 1/3 + 1/3 === 1', () => {
    const third = Rational.from(1, 3);
    expect(Rational.sum([third, third, third]).eq(Rational.one())).toBe(true);
  });

  it('compares by cross-multiplication without division', () => {
    expect(Rational.from(3333, 10000).compare(Rational.from(1, 3))).toBe(-1);
    expect(Rational.from(1, 2).compare(Rational.from(5000, 10000))).toBe(0);
    expect(Rational.from(2, 3).gt(Rational.from(6666, 10000))).toBe(true);
  });

  it('exactly-half is NOT strictly greater than 1/2 (quorum boundary)', () => {
    const half = Rational.from(1, 2);
    expect(Rational.from(5000, 10000).gt(half)).toBe(false);
    expect(Rational.from(5001, 10000).gt(half)).toBe(true);
    expect(Rational.from(5000, 10000).gte(half)).toBe(true);
  });

  it('multiplies: 2/3 of 3/4 is 1/2', () => {
    expect(
      Rational.from(2, 3).mul(Rational.from(3, 4)).eq(Rational.from(1, 2)),
    ).toBe(true);
  });

  it('renders decimals half-up and percents', () => {
    expect(Rational.from(1, 3).toDecimalString(4)).toBe('0.3333');
    expect(Rational.from(2, 3).toDecimalString(4)).toBe('0.6667');
    expect(Rational.from(1, 1).toDecimalString(4)).toBe('1.0000');
    expect(Rational.from(1, 2).toPercentString(2)).toBe('50.00 %');
  });

  it('serializes bigints as strings', () => {
    expect(Rational.from(2, 6).toJSON()).toEqual({ num: '1', den: '3' });
  });

  it('property: random integer partitions always sum to exactly 1', () => {
    let seed = 42;
    const rand = (max: number) => {
      seed ^= seed << 13;
      seed ^= seed >> 17;
      seed ^= seed << 5;
      seed |= 0;
      return (Math.abs(seed) % max) + 1;
    };
    for (let round = 0; round < 200; round++) {
      const den = rand(999_983) + 1;
      const parts: number[] = [];
      let remaining = den;
      const count = rand(12);
      for (let i = 0; i < count - 1 && remaining > 1; i++) {
        const part = rand(remaining - 1);
        parts.push(part);
        remaining -= part;
      }
      parts.push(remaining);
      const total = Rational.sum(parts.map((p) => Rational.from(p, den)));
      expect(total.eq(Rational.one())).toBe(true);
    }
  });
});
