import { compare } from './compare';


/**
 * compare TESTS
 *
 * @group unit/compare
 */


describe('compare', () => {

  describe('numbers', () => {
    it('compares basic numbers in ascending order by default', () => {
      expect(compare(1, 1)).toBe(0);
      expect(compare(1, 2)).toBe(-1);
      expect(compare(2, 1)).toBe(1);
      expect(compare(-5, -2)).toBe(-1);
    });

    it('handles NaN deterministically', () => {
      expect(compare(Number.NaN, Number.NaN)).toBe(0);
      expect(compare(Number.NaN, 1)).toBe(1);
      expect(compare(1, Number.NaN)).toBe(-1);
    });

    it('respects order="desc" for numbers', () => {
      expect(compare(1, 2, { order: 'desc' })).toBe(1);
      expect(compare(2, 1, { order: 'desc' })).toBe(-1);
      expect(compare(5, 5, { order: 'desc' })).toBe(0);
    });
  });

  describe('bigints', () => {
    it('compares bigints correctly', () => {
      expect(compare(1n, 1n)).toBe(0);
      expect(compare(1n, 2n)).toBe(-1);
      expect(compare(2n, 1n)).toBe(1);
      expect(compare(-10n, -2n)).toBe(-1);
    });

    it('respects order with bigints', () => {
      expect(compare(1n, 2n, { order: 'desc' })).toBe(1);
      expect(compare(2n, 1n, { order: 'desc' })).toBe(-1);
    });
  });

  describe('booleans', () => {
    it('treats false < true', () => {
      expect(compare(false, false)).toBe(0);
      expect(compare(false, true)).toBe(-1);
      expect(compare(true, false)).toBe(1);
    });

    it('respects order with booleans', () => {
      expect(compare(false, true, { order: 'desc' })).toBe(1);
      expect(compare(true, false, { order: 'desc' })).toBe(-1);
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
      expect(compare('a', 'A', { collator: { sensitivity: 'case' } })).toBe(1);
    });

    it('supports passing a Collator instance', () => {
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      expect(compare('2', '10', { collator })).toBe(-1);
      expect(compare('A', 'a', { collator })).toBe(0);
    });

    it('respects order with strings', () => {
      expect(compare('apple', 'banana', { order: 'desc' })).toBe(1);
      expect(compare('banana', 'apple', { order: 'desc' })).toBe(-1);
    });
  });

  describe('dates', () => {
    it('compares valid dates by time value', () => {
      const d1 = new Date('2000-01-01T00:00:00.000Z');
      const d2 = new Date('2000-01-02T00:00:00.000Z');

      expect(compare(d1, d1)).toBe(0);
      expect(compare(d1, d2)).toBe(-1);
      expect(compare(d2, d1)).toBe(1);
    });

    it('handles invalid dates deterministically', () => {
      const invalid1 = new Date('invalid-1');
      const invalid2 = new Date('invalid-2');
      const valid = new Date('2000-01-01T00:00:00.000Z');

      expect(compare(invalid1, invalid2)).toBe(0);
      expect(compare(invalid1, valid)).toBe(1);
      expect(compare(valid, invalid2)).toBe(-1);
    });

    it('respects order with dates', () => {
      const d1 = new Date('2000-01-01T00:00:00.000Z');
      const d2 = new Date('2000-01-02T00:00:00.000Z');
      expect(compare(d1, d2, { order: 'desc' })).toBe(1);
      expect(compare(d2, d1, { order: 'desc' })).toBe(-1);
    });
  });

  describe('null and undefined handling', () => {
    it('treats two nullish values as equal', () => {
      expect(compare(null, null)).toBe(0);
      expect(compare(undefined, undefined)).toBe(0);
      expect(compare(null, undefined)).toBe(0);
    });

    it('places nullish values last by default', () => {
      expect(compare(null, 1)).toBe(1);
      expect(compare(undefined, 'a')).toBe(1);
      expect(compare(true, undefined)).toBe(-1);
    });

    it('supports nullsPriority="first"', () => {
      expect(compare(null, 1, { nullsPriority: 'first' })).toBe(-1);
      expect(compare('a', undefined, { nullsPriority: 'first' })).toBe(1);
    });

    it('nullsPriority also interacts with order', () => {
      // With first + desc, the sign flips
      expect(compare(null, 1, { nullsPriority: 'first', order: 'desc' })).toBe(1);
      expect(compare(1, null, { nullsPriority: 'first', order: 'desc' })).toBe(-1);
    });
  });

  describe('mixed types behavior', () => {
    it('default mixedKind="rank" uses deterministic kind ranking', () => {
      // boolean < number < bigint < date < string
      expect(compare(true, 0)).toBe(-1); // boolean vs number
      expect(compare(1, 1n)).toBe(-1); // number vs bigint
      expect(compare(1n, new Date())).toBe(-1); // bigint vs date
      expect(compare(new Date(), 'x')).toBe(-1); // date vs string
      expect(compare('x', 9)).toBe(1); // string vs number
    });

    it('mixedKind="numeric" coerces values to numbers with NaN handling', () => {
      expect(compare('5' as any, 3 as any, { mixedKind: 'numeric' })).toBe(1);
      expect(compare('3' as any, 5 as any, { mixedKind: 'numeric' })).toBe(-1);
      expect(compare('not-a-number' as any, 7 as any, { mixedKind: 'numeric' })).toBe(1); // NaN > number
      expect(compare('not-a-number' as any, 'also-nan' as any, { mixedKind: 'numeric' })).toBe(0);
    });

    it('mixedKind="string" compares String(a) vs String(b) using collator', () => {
      expect(compare(5 as any, '10' as any, { mixedKind: 'string' })).toBe(1); // '5' > '10' lexicographically
      expect(compare(5 as any, '10' as any, { mixedKind: 'string', collator: { numeric: true } })).toBe(-1); // numeric collation
    });

    it('order applies to mixed kind results as well', () => {
      expect(compare(true, 0, { order: 'desc' })).toBe(1);
      expect(compare('5' as any, 3 as any, { mixedKind: 'numeric', order: 'desc' })).toBe(-1);
    });
  });

  describe('custom comparison function', () => {
    it('uses the provided comparisonFunc for custom objects', () => {
      type Obj = { n: number };
      const a: Obj = { n: 1 };
      const b: Obj = { n: 3 };

      const byN = (x: Obj, y: Obj) => x.n - y.n;
      expect(compare(a, b, { comparisonFunc: byN })).toBe(-1);
      expect(compare(b, a, { comparisonFunc: byN })).toBe(1);
      expect(compare(a, a, { comparisonFunc: byN })).toBe(0);
    });

    it('applies order after custom comparison function', () => {
      type Obj = { n: number };
      const a: Obj = { n: 1 };
      const b: Obj = { n: 3 };
      const byN = (x: Obj, y: Obj) => x.n - y.n;

      expect(compare(a, b, { comparisonFunc: byN, order: 'desc' })).toBe(1);
      expect(compare(b, a, { comparisonFunc: byN, order: 'desc' })).toBe(-1);
    });
  });
});


