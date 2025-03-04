import lodashMapValues from 'lodash/mapValues';


export interface MapValuesOptions {
  predicate?: (val: any) => boolean;
  ignoreEmpty?: boolean;
}


function isEmptyLimited(obj: any) {
  return obj === null || obj === undefined || Number.isNaN(obj);
}


function _mapValues(obj: any, mapper: (val: any) => any, visited: any[], options: MapValuesOptions): any {

  if (visited.includes(obj)) return obj;

  const { predicate, ignoreEmpty } = options;

  if (ignoreEmpty && (obj === null || obj === undefined)) return obj;

  if ((typeof obj === typeof 'string' || isEmptyLimited(obj) || Object.keys(obj).length === 0) && !Array.isArray(obj)) {
    if (!predicate || predicate(obj)) return mapper(obj);

    return obj;
  }

  visited.push(obj);

  const result = lodashMapValues(obj, (o) => _mapValues(o, mapper, visited, options));

  if (Array.isArray(obj)) return Object.values(result);

  return result;
}

/**
 * Makes a deep mapping of all properties in an object, or cells in array based on a mapper function. This includes nested objects and arrays.
 * Similar to lodash's mapValues, but with the added ability to map arrays and performs deep recursion, while safe from circular referencing.
 *
 * @param {any} obj The object which properties to map
 * @param {(val: any) => any} mapper The mapping function to affect on each property
 * @param {MapValuesOptions} (optional) options to modify the behavior of the function
 * @param {boolean} (optional) A function to determine if to apply the mapper on a property
 *
 * @example
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
 * This function works only on values of properties and cells of arrays. It does not evaluate a primitive argument:
 *
 * @example
 * ```typescript
 * expect(mapValues('string', mappingFunction)).toEqual('string');
 * ```
 *
 * **Warning:** The mapper is applied on all properties that are not `null`, `undefined`,` `NaN`, array or object.
 * However, the way the function verifies whether an item is object or not is simply by checking if it has properties.
 * If you want to secure the function from applying the mapper on other types that JS consider to be "objects", you should use the `predicate` or build a safety check within the mapper itself.
 *
 * Optional Modifiers:
 * ===================
 * `predicate`
 * -------------------
 * A function to determine if to apply the mapper on a property:
 *
 * @example
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
 * expect(mapValues(obj, mappingFunction, { predicate })).toEqual({
 *  one: 'one!',
 *  two: 2,
 *  three: { prop: 'three' },
 *  arr: ['four!', 5]
 * });
 * ```
 *
 * `ignoreEmpty`
 * ------------
 * *defaults to* `true`
 * When set to `false`, the mapper will be applied on `null`, `undefined` and `NaN` values:
 *
 * @example
 * ```typescript
 * const obj = {
 *  one: 'one',
 *  two: null,
 *  three: { prop: undefined }
 * }
 *
 * function mappingFunction(val: string) {
 *  return `${val}!`;
 * }
 *
 * expect(mapValues(obj, mappingFunction)).toEqual({
 *  one: 'one!',
 *  two: null,
 *  three: { prop: undefined }
 * });
 *
 * expect(mapValues(obj, mappingFunction, { ignoreEmpty: false })).toEqual({
 *  one: 'one!',
 *  two: 'null!',
 *  three: { prop: 'undefined!' }
 * });
 * ```
 */
export default function mapValues(obj: any, mapper: (val: any) => any, options?: MapValuesOptions): any {

  const { predicate } = options || {};
  const ignoreEmpty = options?.ignoreEmpty ?? true;

  if (obj === null || obj === undefined) return obj;

  if (Object.keys(obj).length === 0 && !Array.isArray(obj)) return obj;

  return _mapValues(obj, mapper, [], { predicate, ignoreEmpty });
}
