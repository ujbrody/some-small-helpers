/* eslint-disable @typescript-eslint/no-explicit-any */

import flattenDeep from 'lodash/flattenDeep';


/**
 * Takes an object literal, and returns all the end values in one flat array.
 * The order of the elements is not guaranteed
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
export function getEndPrimitives<T = unknown>(obj: any): T[] {

  if (typeof obj === typeof 'string') return [obj];

  const values = flattenDeep(Object.values(obj).map((value) => getEndPrimitives(value)));

  if (values.length === 0) return [obj];

  return values as unknown as T[];
}


export default getEndPrimitives;
