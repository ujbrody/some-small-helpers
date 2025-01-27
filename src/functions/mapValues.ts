import lodashMapValues from 'lodash/mapValues';


function _mapValues(obj: any, mapper: (val: any) => any, predicate?: (val: any) => boolean): any {

  if (obj === null || obj === undefined) return obj;

  if ((typeof obj === typeof 'string' || Object.keys(obj).length === 0) && !Array.isArray(obj)) {
    if (!predicate || predicate(obj)) return mapper(obj);

    return obj;
  }

  const result = lodashMapValues(obj, (o) => _mapValues(o, mapper, predicate));

  if (Array.isArray(obj)) return Object.values(result);

  return result;
}

/**
 * Makes a deep mapping of all properties in an object, or cells in array based on a mapper function. This includes nested objects and arrays.
 * Similar to lodash's mapValues, but with the added ability to map arrays and performs deep recursion, while safe from circular referencing.
 *
 * ```typescript
 * const obj = {
 *  one: 'one',
 *  two: 2,
 *  three: { prop: 'three' },
 *  arr: ['four', 5]
 * }
 *
 * function mappingFunction(val: string) {
 *  return `${val}!`;
 * }
 *
 * expect(mapValues(obj, mappingFunction)).toEqual({
 *  one: 'one!',
 *  two: '2!',
 * three: { prop: 'three!' },
 * arr: ['four!', '5!']
 * });
 * ```
 *
 * A third, optional parameter can be passed to only apply the mapping on certain properties, decided by a predicate function:
 *
 * ```typescript
 * const obj = {
 *  one: 'one',
 *  two: 2,
 *  three: { prop: 'three' },
 *  arr: ['four', 5]
 * }
 *
 * function mappingFunction(val: string) {
 *  return `${val}!`;
 * }
 *
 * function predicate(val: any) {
 *  return typeof val === typeof 'string';
 * }
 *
 * expect(mapValues(obj, mappingFunction, predicate)).toEqual({
 *  one: 'one!',
 *  two: 2,
 *  three: { prop: 'three' },
 *  arr: ['four!', 5]
 * });
 * ```
 *
 * This function works only on values of properties and cells of arrays. It does not evaluate a primitive argument:
 *
 * ```typescript
 * expect(mapValues('string', mappingFunction)).toEqual('string');
 * ```
 * Using a predicate, it is possible to make sure the mapping is only applied on certain type of properties
 * @param obj The object which properties to map
 * @param mapper The mapping function to affect on each property
 * @param predicate (optional) A function to determine if to apply the mapper on a property
 */
export default function mapValues(obj: any, mapper: (val: any) => any, predicate?: (val: any) => boolean): any {

  if (obj === null || obj === undefined) return obj;

  if (Object.keys(obj).length === 0 && !Array.isArray(obj)) return obj;

  return _mapValues(obj, mapper, predicate);
}
