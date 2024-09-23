/* eslint-disable @typescript-eslint/no-explicit-any */

import flattenDeep from 'lodash/flattenDeep';


/**
 * Takes an enumerable, and returns all the end values in one flat array.
 * The order of the elements is not guaranteed.
 * Strings are  not treated as enumerable types in this function
 *
 * ```typescript
 * const a = {
 *  bar: {
 *    foo: [{ blah: 'end' }],
 *    boom: 'another end'
 *  },
 *  bar2: 'third end'
 * };
 *
 * expect(getEndValues(a)).toEqual(['end', 'another end', 'third end']);
 * ```
 * @param obj Object to break down
 * @returns a flat array of all the end value nested within the object
 */
export function flattenValues<T = unknown>(obj: any): T[] {

  if (typeof obj === typeof 'string') return [obj]; // This is necessary because in this case, JS will treat a string as an array of chars

  const values = flattenDeep(Object.values(obj).map((value) => flattenValues(value)));

  if (values.length === 0) return [obj];

  return values as unknown as T[];
}


export default flattenValues;
