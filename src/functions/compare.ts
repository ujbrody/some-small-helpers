export type ComparisonResult = -1 | 0 | 1;

export interface CompareOptionsBase<T> {
  order?: 'asc' | 'desc';
  nullsPriority?: 'first' | 'last'; // Should nulls/undefined be first in comparison or last
  mixedKind?: 'rank' | 'numeric' | 'string'; // How to handle mixed types in comparison?
  collator?: Intl.Collator | (Intl.CollatorOptions & { locale?: string | string[] });
  comparisonFunc?: (a: T, b: T) => number | undefined; // A custom function to compare two items
}


type Supported =
  | number
  | bigint
  | string
  | Date
  | boolean
  | null
  | undefined;

export type CompareOptionsForSupported<T extends Supported> = CompareOptionsBase<T>;

export type CompareOptionsForCustom<T> = CompareOptionsBase<T> & Required<Pick<CompareOptionsBase<T>, 'comparisonFunc'>>;
// If the type of one of the two items is not supported, consumer of the function must provide a custom comparison function


// Narrow kind for consistent branching
function kindOf(val: Supported):
  | 'number'
  | 'bigint'
  | 'string'
  | 'date'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'unknown' {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val instanceof Date) return 'date';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'bigint') return 'bigint';
  if (typeof val === 'string') return 'string';
  if (typeof val === 'boolean') return 'boolean';
  return 'unknown'; // unreachable safeguard
}

const defaultCollator = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: false,
  caseFirst: 'false'
});

function resolveCollator(option?: CompareOptionsBase<unknown>['collator']): Intl.Collator {
  if (!option) return defaultCollator;

  if (option instanceof Intl.Collator) return option;

  const { locale, ...restOfOptions } = option;

  return new Intl.Collator(locale, restOfOptions);
}


// ---- Overloading the function ----

// Built-in primitives support
/**
 * A flexible comparator for primitives and custom types that returns `-1`, `0`, or `1`.
 * Can be used directly or as a comparator for `Array.prototype.sort`.
 *
 * The function handles numbers (with `NaN` awareness), `bigint`, strings (via `Intl.Collator`),
 * dates (by timestamp, handling invalid dates), booleans (`false < true`), and `null`/`undefined`
 * with a configurable priority. For mixed-type comparisons, choose between deterministic ranking,
 * numeric coercion, or string coercion.
 *
 * If you provide a `comparisonFunc`, it takes precedence. Returning `undefined` from that function
 * falls back to the built-in behavior.
 *
 * @param {any} a The first item
 * @param {any} b The second item
 * @param {CompareOptionsBase<any>} options (optional) options to modify the behavior of the function
 *
 * @example
 * ```typescript
 * // Direct comparisons
 * compare(2, 10);                 // -1
 * compare(new Date('2021-01-02'), new Date('2021-01-01')); // 1
 * compare('Apple', 'banana');     // -1 (case-insensitive by default)
 *
 * // Sorting with default ascending order
 * [3, 1, 2].sort((x, y) => compare(x, y)); // [1, 2, 3]
 *
 * // Descending order
 * ['a', 'c', 'b'].sort((x, y) => compare(x, y, { order: 'desc' })); // ['c', 'b', 'a']
 * ```
 *
 * Options
 * =========
 * `order`
 * -------
 * Sort direction: `'asc'` (default) or `'desc'`.
 *
 * @example
 * ```typescript
 * compare(1, 2, { order: 'asc' });  // -1
 * compare(1, 2, { order: 'desc' }); // 1
 * ```
 *
 * `nullsPriority`
 * ---------------
 * Placement for `null`/`undefined` values: `'last'` (default) or `'first'`.
 * If both values are nullish, they are considered equal (`0`).
 *
 * @example
 * ```typescript
 * const items = [3, null, 1, undefined, 2];
 * items.sort((a, b) => compare(a, b, { nullsPriority: 'last' }));  // [1, 2, 3, null, undefined]
 * items.sort((a, b) => compare(a, b, { nullsPriority: 'first' })); // [null, undefined, 1, 2, 3]
 * ```
 *
 * `mixedKind`
 * ----------
 * How to compare values of different kinds (e.g., a number vs a string):
 * - `'rank'` (default): deterministic order by type: boolean < number < bigint < date < string
 *   (nullish are handled by `nullsPriority`). Avoids surprising coercions.
 * - `'numeric'`: coerce both sides to `Number` and compare numerically. `NaN` is treated as greater
 *   than any numeric value in ascending order; two `NaN`s are equal.
 * - `'string'`: coerce both sides to `String` and compare using `Intl.Collator` (see `collator`).
 *
 * @example
 * ```typescript
 * // rank (default)
 * const mixed = [true, 2, '3', new Date('2020-01-01'), false];
 * mixed.sort((a, b) => compare(a as any, b as any));
 * // => [false, true, 2, new Date('2020-01-01'), '3']
 *
 * // numeric coercion
 * const items = ['10', 2, 'abc'];
 * items.sort((a, b) => compare(a as any, b as any, { mixedKind: 'numeric' }));
 * // => [2, '10', 'abc']    // 'abc' -> NaN, comes after numbers in ascending order
 *
 * // string coercion (locale-aware)
 * const items2 = [10, '2'];
 * items2.sort((a, b) => compare(a as any, b as any, { mixedKind: 'string' }));
 * // => ['2', 10]
 * ```
 *
 * `collator`
 * ----------
 * Controls string comparison. Accepts either an `Intl.Collator` instance or
 * `{ locale?: string | string[] } & Intl.CollatorOptions`. Defaults to
 * `new Intl.Collator(undefined, { sensitivity: 'base', numeric: false, caseFirst: 'false' })`.
 * This means comparison is case-insensitive by default and does not do natural numeric ordering.
 *
 * @example
 * ```typescript
 * // Natural sort of strings that include numbers
 * const files = ['file2', 'file10', 'file1'];
 * files.sort((a, b) => compare(a, b, { collator: { numeric: true } }));
 * // => ['file1', 'file2', 'file10']
 *
 * // Locale-aware (German umlaut example)
 * compare('ä', 'z', { collator: { locale: 'de', sensitivity: 'base' } }); // -1
 * ```
 *
 * `comparisonFunc`
 * ----------------
 * A custom comparator `(a, b) => number | undefined`. If it returns a number, that result is used
 * (and will be adjusted for `order`). If it returns `undefined`, the function falls back to the
 * default comparison rules above. When `a`/`b` are not supported primitives, you must supply this
 * function (see typing of the overload).
 *
 * @example
 * ```typescript
 * // Compare objects by a field, then by a tie-breaker
 * type User = { id: number; name: string; age: number };
 * const users: User[] = [
 *   { id: 2, name: 'Ada', age: 35 },
 *   { id: 1, name: 'Bob', age: 35 },
 *   { id: 3, name: 'Carl', age: 28 }
 * ];
 *
 * users.sort((u1, u2) => compare(u1, u2, {
 *   comparisonFunc: (x, y) => {
 *     if (x.age !== y.age) return x.age - y.age;      // primary key
 *     return x.name.localeCompare(y.name);            // tie-breaker
 *   }
 * }));
 * // => [
 * //   { id: 3, name: 'Carl', age: 28 },
 * //   { id: 2, name: 'Ada',  age: 35 },
 * //   { id: 1, name: 'Bob',  age: 35 }
 * // ]
 * ```
 *
 * notes:
 * - TS: When at least one of the two items is not a primitive, `comparisonFunc` is required.
 * - If `comparisonFunc` is not provided and one of the two items is not a primitive, the function will perform a string comparison per default JS behavior. The collator option has no effect here.
 * - `comparisonFunc` can return any number: negative numbers will be coerced to `-1`, positive numbers to `1` when returned.
 * - `comparisonFunc` can return `undefined` to fallback to the default behavior of `compare`.
 *
 * Notes on specific types
 * -----------------------
 * - Numbers: `NaN` is considered greater than any numeric value in ascending order; two `NaN`s are equal.
 * - BigInt: uses numeric ordering.
 * - Boolean: `false < true`.
 * - Date: compared by `.getTime()`; two invalid dates are equal, and an invalid date is considered
 *   greater than a valid date in ascending order.
 * - String: compared using the provided/derived `Intl.Collator`.
 */
export function compare<T extends Supported>(a: T, b: T, options?: CompareOptionsForSupported<T>): ComparisonResult;


// Custom types support (comparisonFunc is required!)
export function compare<T>(a: T, b: T, options: CompareOptionsForCustom<T>): ComparisonResult;


// ---- Implementation ----
export function compare<T>(a: T, b: T, options?: CompareOptionsBase<T>): ComparisonResult {

  const {
    order = 'asc',
    nullsPriority = 'last',
    mixedKind = 'rank',
    comparisonFunc
  } = options || {};
  const factor = order === 'asc' ? 1 : -1;


  // If user supplies a custom comparison function it always wins immediately
  if (comparisonFunc) {
    const result = comparisonFunc(a, b);
    if (result !== undefined) {
      return Math.sign(result) * factor as ComparisonResult;
    }

    // If `comparisonFunc` returned `undefined`, we know the consumer wants to fallback to the default behavior of `compare`
  }


  // From this point on, we're assuming that both items are primitives
  const aSupported = a as Supported;
  const bSupported = b as Supported;

  const aKind = kindOf(aSupported);
  const bKind = kindOf(bSupported);


  // Null/Undefined policy
  if (aKind === 'null' || aKind === 'undefined' || bKind === 'null' || bKind === 'undefined' || aKind === 'unknown' || bKind === 'unknown') {

    const aIsNullish = aKind === 'null' || aKind === 'undefined';
    const bIsNullish = bKind === 'null' || bKind === 'undefined';

    if (aIsNullish && bIsNullish) return 0;

    if (aIsNullish) {
      return ((nullsPriority === 'first' ? -1 : 1) * factor) as ComparisonResult;
    } else if (bIsNullish) {
      return ((nullsPriority === 'first' ? 1 : -1) * factor) as ComparisonResult;
    }

    return String(a).localeCompare(String(b)) * factor as ComparisonResult;
  }


  // Handling mixed types
  if (aKind !== bKind) {
    if (mixedKind === 'numeric') {
      // Attempted numeric subtraction
      // NaN guarded to keep sort stable
      const n1 = Number(a as Supported);
      const n2 = Number(b as Supported);

      if (Number.isNaN(n1) && Number.isNaN(n2)) return 0;
      if (Number.isNaN(n1)) return 1 * factor as ComparisonResult;
      if (Number.isNaN(n2)) return -1 * factor as ComparisonResult;

      return Math.sign(n1 - n2) * factor as ComparisonResult;
    }

    if (mixedKind === 'string') {
      const s1 = String(a as Supported);
      const s2 = String(b as Supported);

      return resolveCollator(options?.collator).compare(s1, s2) * factor as ComparisonResult;
    }

    // Default: deterministic rank to avoid surprises
    const kindRank: Record<ReturnType<typeof kindOf>, number> = {
      boolean: 0,
      number: 1,
      bigint: 2,
      date: 3,
      string: 4,
      null: -1,
      undefined: -2,
      unknown: -3,
    };
    return Math.sign(kindRank[aKind] - kindRank[bKind]) * factor as ComparisonResult;
  }


  // From this point, both items are of the same supported type
  switch (aKind) {
    case 'number': {
      const n1 = a as number;
      const n2 = b as number;

      if (Number.isNaN(n1) && Number.isNaN(n2)) return 0;
      if (Number.isNaN(n1)) return 1 * factor as ComparisonResult;
      if (Number.isNaN(n2)) return -1 * factor as ComparisonResult;

      return Math.sign(n1 - n2) * factor as ComparisonResult;
    }

    case 'bigint': {
      const x = a as bigint;
      const y = b as bigint;

      if (x === y) return 0;

      return (x < y ? -1 : 1) * factor as ComparisonResult;
    }

    case 'boolean': {
      const n1 = a ? 1 : 0;
      const n2 = b ? 1 : 0;

      return Math.sign(n1 - n2) * factor as ComparisonResult;
    }

    case 'date': {
      const d1 = (a as Date).getTime();
      const d2 = (b as Date).getTime();

      if (Number.isNaN(d1) && Number.isNaN(d2)) return 0;
      if (Number.isNaN(d1)) return 1 * factor as ComparisonResult;
      if (Number.isNaN(d2)) return -1 * factor as ComparisonResult;

      return Math.sign(d1 - d2) * factor as ComparisonResult;
    }

    case 'string': {
      const s1 = String(a as Supported);
      const s2 = String(b as Supported);

      return resolveCollator(options?.collator).compare(s1, s2) * factor as ComparisonResult;
    }

    default: { return 0 as ComparisonResult; } // Technically unreachable, but we need to satisfy the type checker
  }
}
