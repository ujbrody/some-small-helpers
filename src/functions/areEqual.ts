import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import pick from 'lodash/pick';
import mapValues from 'lodash/mapValues';

import safeStringify from './safeStringify';


type Predicate = (item1: any, item2: any) => boolean | undefined;

export interface AreEqualOptions {
  comparisonProps?: string[];
  stringDate?: boolean;
  ignoreArrayOrder?: boolean;
  checkCases?: Predicate[];
  invalidDatesAreEqual?: boolean;
}

const defaultAreEqualOptions: NonNullable<Omit<AreEqualOptions, 'checkCases'> & { customizer?: Predicate }> = {
  comparisonProps: [],
  stringDate: false,
  ignoreArrayOrder: false,
  invalidDatesAreEqual: false
};


function hasEnumerableEntries(obj: any): boolean {

  if (obj === null || typeof obj !== typeof {}) return false;

  try {
    Object.entries(obj);
    return !Array.isArray(obj);
  } catch {
    return false;
  }
}

function areDates(item1: any, item2: any): boolean {
  if (item1 instanceof Date && item2 instanceof Date) {
    return true;
  }

  // Check if strings can be converted to valid dates
  if (typeof item1 === 'string' || typeof item2 === 'string') {
    const date1 = new Date(item1);
    const date2 = new Date(item2);

    return !Number.isNaN(date1.getTime()) && !Number.isNaN(date2.getTime());
  }

  return false;
}


function compareDatesWhenValidOrInvalid(date1: Date, date2: Date, invalidDatesAreEqual: boolean): boolean {
  if (invalidDatesAreEqual && (Number.isNaN(date1.getTime()) || Number.isNaN(date2.getTime()))) {
    return true;
  }

  return date1.getTime() === date2.getTime();
}


function getWithAllArraysSorted(value: any): any {
  // Handle null/undefined
  if (value === null) return value;

  // Handle arrays - sort them and recursively process elements
  if (Array.isArray(value)) {
    const processed = value.map((item) => getWithAllArraysSorted(item));
    return processed.sort((a, b) => {
      const aStr = safeStringify(a);
      const bStr = safeStringify(b);
      return aStr < bStr ? -1 : (aStr > bStr ? 1 : 0);
    });
  }

  // Handle objects (including class instances)
  if (typeof value === 'object') {
    // Handle Map
    if (value instanceof Map) {
      return new Map([...value.entries()].map(([k, v]) => [k, getWithAllArraysSorted(v)]));
    }

    // Handle Set
    if (value instanceof Set) {
      return new Set([...value].map((v) => getWithAllArraysSorted(v)));
    }

    if (hasEnumerableEntries(value)) {
      return mapValues(value, getWithAllArraysSorted);
    }
  }

  // Return all else as-is
  return value;
}


function buildCustomizer(cases: Predicate[]): Predicate {
  function customizer(val1: any, val2: any): boolean | undefined {

    let result: boolean | undefined;

    for (const checkCase of cases) {
      result = checkCase(val1, val2);

      if (result === true) return true;
    }

    if (result === false) return false;

    return undefined;
  }

  return customizer;
}


function _areEqual(item1: any, item2: any, passed: any[], options: typeof defaultAreEqualOptions): boolean {

  const firstCheck = options.customizer && options.customizer(item1, item2);

  if (firstCheck !== undefined) return firstCheck;

  if (passed.includes(item1)) {
    return isEqual(item1, item2);
  }

  let a = item1;
  let b = item2;

  /**
   * DATE COMPARISON
   */
  if (options.stringDate) {
    if (areDates(a, b)) {
      a = new Date(a);
      b = new Date(b);

      return compareDatesWhenValidOrInvalid(a, b, options.invalidDatesAreEqual || false);
    }
  } else if (a instanceof Date && b instanceof Date) {
    return compareDatesWhenValidOrInvalid(a, b, options.invalidDatesAreEqual || false);
  }

  /**
   * ARRAY COMPARISON
   */
  if (Array.isArray(a) && Array.isArray(b)) {
    passed.push(a, b);

    if (a.length !== b.length) return false;

    if (options.ignoreArrayOrder) {
      a = getWithAllArraysSorted(a) as any[];
      b = getWithAllArraysSorted(b) as any[];
    }

    return a.every((item: any, index: number) => _areEqual(item, b[index], passed, options));
  }

  /**
   * OBJECT COMPARISON
   */

  if (hasEnumerableEntries(a) && hasEnumerableEntries(b)) {
    passed.push(a, b);

    if (options.comparisonProps && options.comparisonProps.length > 0) {
      a = pick(item1, options.comparisonProps);
      b = pick(item2, options.comparisonProps);
    }

    const aKeys = [...Object.keys(a), ...Object.getOwnPropertySymbols(a)];
    const bKeys = [...Object.keys(b), ...Object.getOwnPropertySymbols(b)];

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => bKeys.includes(key) && _areEqual(a[key], b[key], passed, options));
  }

  if (options.customizer) {
    return isEqualWith(a, b, options.customizer);
  }

  return isEqual(a, b);
}


/**
 * A wrapper around `lodash/isEqual` that takes two items of unspecified type and check if they are equal in values while also providing options to modify the behavior of the function.
 * The function digs recursively into objects and array to analyze comparison between objects.
 *
 * @param {any} item1 The first item
 * @param {any} item2 The second item
 * @param {AreEqualOptions} options (optional) options to modify the behavior of the function
 *
 * @example
 * ```typescript
 * const item1 = { street: '123 Place', city: 'Atlanta', state: 'GA' };
 * const item2 = { street: '123 Place', city: 'Atlanta', state: 'Georgia' };
 *
 * expect(areEqual(item1, item2)).toBE(false);
 *
 * const item3 = { street: '123 Place', city: 'Atlanta', state: 'GA' };
 * const item4 = { street: '123 Place', city: 'Atlanta', state: 'GA' };
 *
 * expect(areEqual(item3, item4)).toBe(true);
 * ```
 *
 * Options
 * =========
 * `comparisonProps`
 * ----------------
 * When making a comparison between two objects, only the properties listed here participate in the comparison.
 *
 * @example
 * ```typescript
 * const item1 = { street: '123 Place', city: 'Atlanta', state: 'GA' };
 * const item2 = { street: '123 Place', city: 'Atlanta', state: 'Georgia' };
 *
 * expect(areEqual(item1, item2)).toBE(false);
 * expect(areEqual(item1, item2, ['street', 'city'])).toBe(true);
 * ```
 *
 * `stringDate`
 * -----------
 * When set to true, any string that could represent a date will be compared with a Date object will be considered a date and will be compared using the `getTime()` method.
 *
 * @example
 * ```typescript
 * const strDate = '1/2/2000';
 * const date = new Date('1/2/2000');
 *
 * expect(areEqual(strDate, date, { stringDate: true })).toBe(true);
 * ```
 *
 * `ignoreArrayOrder`
 * ------------------
 * (default to `false`) when set to `true`, the equality is only considering the content of arrays without regarding their order.
 *
 * @example
 * ```typescript
 * const arr1 = [0, 1, 2, 3, 4];
 * const arr2 = [4, 3, 2, 1, 0];
 *
 * expect(areEqual(arr1, arr2, { ignoreArrayOrder: true })).toBe(true);
 * ```
 *
 * **Important Note:** Being a wrapper around `lodash/isEqual`, this function carries the same behavior for Maps and Sets, in that it always ignores their orders and orders of arrays within them:
 *
 * @example
 * ```typescript
 * type NestedMapType = Map<string, Set<number> | number[]>;
 * const map1: NestedMapType = new Map();
 * map1.set('a', new Set([1, 2, 3]));
 * map1.set('b', [1, 2, 3]);
 *
 * const map2: NestedMapType = new Map();
 * map2.set('b', [3, 2, 1]);
 * map2.set('a', new Set([3, 2, 1]));
 *
 * expect(areEqual(map1, map2)).toBe(true);
 * ```
 *
 * `checkCases`
 * ------------
 * Acts as a customizer for the `isEqualWith` function, but with two differences:
 * 1. Instead of a single customizer, it takes an array of customizers and applies them **in order** to make the comparison.
 * 2. The cases are applied on the object recursively throughout all the levels of the object graph.
 * It is enough that one of the customizers returns `true` for the function to return `true`.
 * Like a customizer in `isEqualWith`, any function here can return `undefined` to indicate that it does not want to make a comparison for that pair of items.
 *
 * @example
 * ```typescript
 * const item1 = { street: '123 Place', city: 'Atlanta', state: 'GA' };
 * const item2 = { street: '123 Place', city: 'Atlanta', state: 'Georgia' };
 *
 * expect(areEqual(item1, item2, { checkCases: [(item1, item2) => item1.state === item2.state] })).toBe(true);
 * ```
 */
export default function areEqual(item1: any, item2: any, options?: AreEqualOptions): boolean {

  const op: typeof defaultAreEqualOptions = {
    comparisonProps: options?.comparisonProps || defaultAreEqualOptions.comparisonProps,
    stringDate: options?.stringDate || defaultAreEqualOptions.stringDate,
    ignoreArrayOrder: options?.ignoreArrayOrder || defaultAreEqualOptions.ignoreArrayOrder,
    invalidDatesAreEqual: options?.invalidDatesAreEqual || defaultAreEqualOptions.invalidDatesAreEqual
  };

  if (options?.checkCases && options.checkCases.length > 0) {
    op.customizer = buildCustomizer(options.checkCases);
  }

  return _areEqual(item1, item2, [], op);
}
