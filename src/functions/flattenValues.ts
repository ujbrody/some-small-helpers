import flattenDeep from 'lodash/flattenDeep';


function isIterable(value: any) {
  return value !== null && typeof value[Symbol.iterator] === 'function';
}

function isEnumerable(value: any) {
  return value !== null && typeof value === 'object';
}

function getArrayOfValuesFromAnyEnumerableOrIterable(obj: any): unknown[] | undefined {

  if (obj instanceof Map) {
    return Object.values(Object.fromEntries(obj));
  }

  if (isIterable(obj)) return [...obj];

  if (isEnumerable(obj)) return Object.values(obj);
}


export interface FlattenValuesOptions {
  returnUnique?: boolean;
}

const defaultOptions: FlattenValuesOptions = {
  returnUnique: false
};


/**
 * Takes an enumerable or iterable, and returns all the end values in one flat array.
 * The order of the elements is not guaranteed.
 * Strings are  not treated as enumerable types in this function
 *
 * @template T The type of the values in the array
 * @param {any} obj Object to break down
 * @param {FlattenValuesOptions} options Options to modify the behavior of the function
 * @returns {T[]} a flat array of all the end value nested within the object
 *
 * @example
 * ```typescript
 * const a = {
 *  bar: {
 *    foo: [{ blah: 'end' }],
 *    boom: 'another end'
 *  },
 *  bar2: 'third end'
 * };
 *
 * expect(getEndValues(a).sort()).toEqual(['end', 'another end', 'third end'].sort());
 * ```
 *
 * Options
 * =======
 * `returnUnique`
 * -------------
 * *Defaults to* `false`
 * When set to `true` all repeating values are eliminated:
 *
 * @example
 * ```typescript
 * expect(flattenValues({ prop1: 'one', prop2: 2, prop1again: 'one}, { returnUnique: true }).sort()).toEqual(['one', 2].sort());
 * ```
 */
export function flattenValues<T = unknown>(obj: any, options?: FlattenValuesOptions): T[] {

  if (typeof obj === typeof 'string') return [obj]; // This is necessary because in this case, JS will treat a string as an array of chars

  const { returnUnique } = {
    returnUnique: options?.returnUnique || defaultOptions.returnUnique
  };

  const arr = getArrayOfValuesFromAnyEnumerableOrIterable(obj);

  if (!arr) return [obj];

  const values = flattenDeep(arr.map((value) => flattenValues(value, options)));

  if (returnUnique) {
    return [...new Set(values as unknown as T[])];
  }

  return values as unknown as T[];
}


export default flattenValues;
