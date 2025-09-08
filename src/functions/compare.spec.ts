import { compare } from './compare';


/**
 * compare TESTS
 *
 * @group unit/compare
 */


describe('compare', () => {

  describe('primitives', () => {

    it('compares any two numbers', () => {
      expect(compare(1, 1)).toBe(0);
      expect(compare(1, 2)).toBe(-1);
      expect(compare(2, 1)).toBe(1);
      expect(compare(-5, -2)).toBe(-1);
    });

    it('compares bigints correctly', () => {
      expect(compare(1n, 1n)).toBe(0);
      expect(compare(1n, 2n)).toBe(-1);
      expect(compare(2n, 1n)).toBe(1);
      expect(compare(-10n, -2n)).toBe(-1);
    });

    it('treats false < true', () => {
      expect(compare(false, false)).toBe(0);
      expect(compare(false, true)).toBe(-1);
      expect(compare(true, false)).toBe(1);
    });

    it('compares valid dates by time value', () => {
      const d1 = new Date(2000, 0, 1);
      const d2 = new Date(2000, 0, 2);

      expect(compare(d1, d1)).toBe(0);
      expect(compare(d1, d2)).toBe(-1);
      expect(compare(d2, d1)).toBe(1);
    });

    it('simply compares strings lexicographically', () => {
      expect(compare('a', 'a')).toBe(0);
      expect(compare('a', 'b')).toBe(-1);
      expect(compare('b', 'a')).toBe(1);
    });

    it('uses comparisonFunc if provided', () => {
      const byLength = (a: string, b: string) => a.length - b.length; // eslint-disable-line unicorn/consistent-function-scoping
      expect(compare('aa', 'b')).toBe(-1);
      expect(compare('aa', 'b', { comparisonFunc: byLength })).toBe(1);
    });

    it('reverses the order if order is "desc" in options', () => {
      const d1 = new Date(2000, 0, 1);
      const d2 = new Date(2000, 0, 2);

      const byLength = (a: string, b: string) => a.length - b.length; // eslint-disable-line unicorn/consistent-function-scoping

      expect(compare(1, 2, { order: 'desc' })).toBe(1);
      expect(compare(1n, 2n, { order: 'desc' })).toBe(1);
      expect(compare(false, true, { order: 'desc' })).toBe(1);
      expect(compare(d1, d2, { order: 'desc' })).toBe(1);
      expect(compare('a', 'b', { order: 'desc' })).toBe(1);
      expect(compare('aa', 'b', { comparisonFunc: byLength, order: 'desc' })).toBe(-1);
    });
  });

  describe('empty values', () => {

    it('handles NaN deterministically', () => {
      expect(compare(Number.NaN, Number.NaN)).toBe(0);
      expect(compare(Number.NaN, 1)).toBe(1);
      expect(compare(1, Number.NaN)).toBe(-1);
    });

    it('handles nulls as lesser by default', () => {
      expect(compare(null, null)).toBe(0);
      expect(compare(null, 1)).toBe(1);
      expect(compare(1, null)).toBe(-1);
    });

    it('handles undefined as lesser by default', () => {
      expect(compare(undefined, undefined)).toBe(0); // eslint-disable-line unicorn/no-useless-undefined

      expect(compare(undefined, 1)).toBe(1);
      expect(compare(1, undefined)).toBe(-1); // eslint-disable-line unicorn/no-useless-undefined
    });

    it('compare null and undefined as equal', () => {
      expect(compare(null, undefined)).toBe(0); // eslint-disable-line unicorn/no-useless-undefined
      expect(compare(undefined, null)).toBe(0);
    });

    it('uses nullsPriority option to dictate the position of null and undefined', () => {
      expect(compare(null, 1, { nullsPriority: 'first' })).toBe(-1);
      expect(compare(1, null, { nullsPriority: 'first' })).toBe(1);

      expect(compare(undefined, 1, { nullsPriority: 'first' })).toBe(-1);
      expect(compare(1, undefined, { nullsPriority: 'first' })).toBe(1);
    });
  });

  describe('strings and collator behavior', () => {

    it('compares strings using default collator (case-insensitive, non-numeric)', () => {
      expect(compare('a', 'A')).toBe(0);
      expect(compare('apple', 'Banana')).toBe(-1);
      // Numeric sequences are not treated as numbers by default
      expect(compare('2', '10')).toBe(1); // '2' > '10' lexicographically
    });

    it('supports collator options object', () => {
      // numeric: true -> treats digit sequences as numbers
      expect(compare('2', '10', { collator: { numeric: true } })).toBe(-1);
      // sensitivity: 'case' -> case-sensitive
      expect(compare('a', 'A', { collator: { sensitivity: 'case' } })).toBe(-1);
    });

    it('supports passing a Collator instance', () => {
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      expect(compare('2', '10', { collator })).toBe(-1);
      expect(compare('A', 'a', { collator })).toBe(0);
    });
  });

  describe('mixed types behavior', () => {

    it('default mixedKind="rank" uses deterministic kind ranking', () => {
      // boolean < number < bigint < date < string
      expect(compare<boolean | number>(true, 0)).toBe(-1); // boolean vs number
      expect(compare<number | bigint>(1, 1n)).toBe(-1); // number vs bigint
      expect(compare<bigint | Date>(1n, new Date())).toBe(-1); // bigint vs date
      expect(compare<Date | string>(new Date(), 'x')).toBe(-1); // date vs string
      expect(compare<string | number>('x', 9)).toBe(1); // string vs number
    });

    it('mixedKind="numeric" coerces values to numbers with NaN handling', () => {
      expect(compare('5' as any, 3 as any, { mixedKind: 'numeric' })).toBe(1);
      expect(compare('3' as any, 5 as any, { mixedKind: 'numeric' })).toBe(-1);
      expect(compare('not-a-number' as any, 7 as any, { mixedKind: 'numeric' })).toBe(1); // NaN > number
      expect(compare('not-a-number' as any, new Date('invalid-date') as any, { mixedKind: 'numeric' })).toBe(0);
    });

    it('mixedKind="string" compares String(a) vs String(b) using collator', () => {
      expect(compare(5 as any, true as any, { mixedKind: 'string' })).toBe(-1); // '5' < 'true' lexicographically
      expect(compare(5 as any, '10' as any, { mixedKind: 'string', collator: { numeric: true } })).toBe(-1); // numeric collation
    });
  });

  describe('Non-primitive inputs', () => {

    it('compares non-primitives using provided comparisonFunc', () => {
      type Obj = { n: number };
      const a: Obj = { n: 1 };
      const b: Obj = { n: 3 };
      const byN = (x: Obj, y: Obj) => x.n - y.n;
      expect(compare(a, b, { comparisonFunc: byN })).toBe(-1);
    });

    it('string comparison when two non-primitives are provided without a comparisonFunc per default JS behavior', () => {
      class Obj {
        n: string;

        constructor(n: number) {
          this.n = String(n);
        }

        toString() {
          return `${this.n}`;
        }
      }

      expect(compare(new Obj(1) as any, new Obj(3) as any)).toBe(-1);
      expect(compare({ n: 1 } as any, { n: 3 } as any)).toBe(0); // Object literals `toString` returns `[object Object]`
    });

    it('make non-primitives string comparisons in the absence of a comparisonFunc while ignoring the provided collator—for string input only', () => {
      class Obj {
        n: string;

        constructor(n: number) {
          this.n = String(n);
        }

        toString() {
          return `${this.n}`;
        }
      }

      expect(compare(new Obj(2) as any, new Obj(10) as any, { mixedKind: 'string', collator: { numeric: true } })).toBe(1); // '2' < '10' lexicographically. The collator is ignored in this case.
    });

    it('returns priority to primitive when mixed with non-primitive without a comparisonFunc', () => {
      type Obj = { n: number };
      const a: Obj = { n: 1 };
      const b: Obj = { n: 1 };
      expect(compare(a as any, b as any)).toBe(0);
    });
  });
});


