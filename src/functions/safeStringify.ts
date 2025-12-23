import isObjectWithoutProperties from 'lodash/isEmpty';


export interface SafeJsonStringifyOptions {
  removeUndefined?: boolean;
  sortContents?: boolean;
}

interface IterableLike {
  [Symbol.iterator]: () => Iterator<unknown>;
}

const defaultSafeJsonStringifyOptions = {
  removeUndefined: false,
  sortContents: false
};

const CIRCULAR_REFERENCE = '<<CIRCULAR>>';


function hasIterator(value: unknown): value is IterableLike {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object' && typeof value !== 'function') return false;

  return typeof (value as IterableLike)[Symbol.iterator] === 'function';
}


function _stringifyValue(val: unknown, passed: unknown[], options: NonNullable<SafeJsonStringifyOptions>): string {

  if (passed.includes(val)) return CIRCULAR_REFERENCE;

  if (val === undefined) {
    if (options.removeUndefined) return '';
    return 'undefined';
  }

  if (val instanceof String) {
    return JSON.stringify(val.valueOf());
  }

  if (val instanceof Date) {
    return JSON.stringify(val);
  }

  /**
   * Maps and Sets
   */
  if (val instanceof Map) {
    passed.push(val);
    const mapString = _stringifyValue([...val], passed, options);
    return `Map(${mapString.slice(1, -1)})`; // Remove the outer brackets
  }

  if (val instanceof Set) {
    passed.push(val);
    const mapString = _stringifyValue([...val], passed, options);
    return `Set(${mapString.slice(1, -1)})`; // Remove the outer brackets
  }

  /**
   * TypedArrays
   */
  if (ArrayBuffer.isView(val)) {
    passed.push(val);
    if (val instanceof BigInt64Array || val instanceof BigUint64Array) {
      const bigIntArray: number[] = [];
      for (const v of val) {
        bigIntArray.push(+v.toString());
      }
      return `${val.constructor.name}(${JSON.stringify(bigIntArray)})`;
    }

    // Other ArrayBuffer views (TypedArrays are iterable; DataView is not)
    if (hasIterator(val)) {
      return `${val.constructor.name}(${JSON.stringify([...val])})`;
    }

    return JSON.stringify(val);
  }

  /**
   * Custom iterables
   */
  if (hasIterator(val) && !Array.isArray(val) && typeof val !== 'string') {
    return JSON.stringify([...val]);
  }

  /**
   * Symbols
   */
  if (typeof val === 'symbol') {
    return val.toString();
  }

  /**
   * Functions
   */
  if (typeof val === 'function') {
    return val.toString();
  }

  /**
   * Arrays
   */
  if (Array.isArray(val)) {
    passed.push(val);
    let stringifiedArray = val.map((item) => _stringifyValue(item, passed, options));

    if (options.removeUndefined) {
      stringifiedArray = stringifiedArray.filter((item) => item !== '');
    }

    if (options.sortContents) {
      stringifiedArray.sort();
    }
    return `[${stringifiedArray.join(',')}]`;
  }

  /**
   * Objects with enumerable properties
   */
  if (typeof val === 'object' && !isObjectWithoutProperties(val)) {
    passed.push(val);
    let entries = Object.entries(val).map(([key, value]) => [`"${key}"`, _stringifyValue(value, passed, options)]);

    if (options.removeUndefined) {
      entries = entries.filter(([, value]) => value !== '');
    }

    const flatEntries = entries.map(([key, value]) => `${key}:${value}`);

    if (options.sortContents) {
      flatEntries.sort();
    }
    return `{${flatEntries.join(',')}}`;
  }

  return JSON.stringify(val);
}


/**
 * Mimics `JSON.stringify` with the added benefits:
 * - Handling special cases, like Maps, Sets, TypedArrays, Symbols, Functions, etc.
 * - Providing safety against circular references or attempts to stringify BigInts
 * - Adding customizations like removing undefined values or sorting the contents of objects and arrays
 * @param {any} val The value to stringify
 * @param {SafeJsonStringifyOptions} [options] (optional) modifies the default behavior of the function
 * @returns {string} The stringified value
 * @example
 * ```typescript
 * const obj = { a: 1, b: 2 };
 * expect(safeStringify(obj)).toBe('{"a":1,"b":2}');
 * const map = new Map([['a', 1], ['b', 2]]);
 * expect(safeStringify(map)).toBe('Map(["a",1],["b",2])');
 * ```
 * Optional Modifiers:
 * ===================
 * `removeUndefined`
 * -------------------
 * *defaults to* `false`
 * When set to `true`, all undefined values **within the object** will be removed from the output
 * @example
 * ```typescript
 * const obj = { a: undefined, b: 1 };
 * expect(safeStringify(obj)).toBe('{"a":undefined,"b":1}');
 * expect(safeStringify(obj, { removeUndefined: true })).toBe('{"b":1}');
 * expect(safeStringify(undefined, { removeUndefined: true })).toBe('undefined');
 * ```
 * `sortContents`
 * ------------
 * *defaults to* `false`
 * When set to `true`, the contents of arrays and objects will be sorted alphabetically. This will included nested arrays and objects.
 * @example
 * ```typescript
 * const obj = { b: 2, a: 1 };
 * expect(safeStringify(obj)).toBe('{"b":2,"a":1}');
 * expect(safeStringify(obj, { sortContents: true })).toBe('{"a":1,"b":2}');
 * const arr = [3, 1, 2];
 * expect(safeStringify(arr)).toBe('[3,1,2]');
 * expect(safeStringify(arr, { sortContents: true })).toBe('[1,2,3]');
 * ```
 */
export default function safeStringify(val: unknown, options?: SafeJsonStringifyOptions): string {

  if (val === undefined) return 'undefined';

  const ops = { ...defaultSafeJsonStringifyOptions, ...options };

  return _stringifyValue(val, [], ops);
}
