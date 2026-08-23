/**
 * Exact non-negative fraction over bigint. All voting/ownership math must go
 * through this class — comparisons cross-multiply, never divide (DOM-006/007).
 */
export class Rational {
  private constructor(
    public readonly num: bigint,
    public readonly den: bigint,
  ) {}

  static from(num: bigint | number, den: bigint | number): Rational {
    let n = typeof num === 'bigint' ? num : BigInt(num);
    let d = typeof den === 'bigint' ? den : BigInt(den);
    if (d === 0n) throw new Error('Rational: denominator must not be zero');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    if (n < 0n) throw new Error('Rational: negative values are not supported');
    const g = Rational.gcd(n, d);
    return new Rational(n / g, d / g);
  }

  static zero(): Rational {
    return new Rational(0n, 1n);
  }

  static one(): Rational {
    return new Rational(1n, 1n);
  }

  static sum(values: Rational[]): Rational {
    return values.reduce((acc, v) => acc.add(v), Rational.zero());
  }

  private static gcd(a: bigint, b: bigint): bigint {
    let x = a < 0n ? -a : a;
    let y = b < 0n ? -b : b;
    while (y !== 0n) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x === 0n ? 1n : x;
  }

  add(other: Rational): Rational {
    return Rational.from(
      this.num * other.den + other.num * this.den,
      this.den * other.den,
    );
  }

  mul(other: Rational): Rational {
    return Rational.from(this.num * other.num, this.den * other.den);
  }

  compare(other: Rational): -1 | 0 | 1 {
    const left = this.num * other.den;
    const right = other.num * this.den;
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  gt(other: Rational): boolean {
    return this.compare(other) > 0;
  }

  gte(other: Rational): boolean {
    return this.compare(other) >= 0;
  }

  eq(other: Rational): boolean {
    return this.compare(other) === 0;
  }

  isZero(): boolean {
    return this.num === 0n;
  }

  toDecimalString(dp = 4): string {
    const scale = 10n ** BigInt(dp);
    const scaled = (this.num * scale + this.den / 2n) / this.den;
    const whole = scaled / scale;
    if (dp === 0) return whole.toString();
    const frac = (scaled % scale).toString().padStart(dp, '0');
    return `${whole.toString()}.${frac}`;
  }

  toPercentString(dp = 2): string {
    return `${this.mul(Rational.from(100, 1)).toDecimalString(dp)} %`;
  }

  toJSON(): { num: string; den: string } {
    return { num: this.num.toString(), den: this.den.toString() };
  }
}
