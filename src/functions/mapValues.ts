import lodashMapValues from 'lodash/mapValues';


export interface MapValuesOptions {
  predicate?: (val: unknown) => boolean;
  ignoreEmpty?: boolean;
}


function isEmptyLimited(obj: unknown) {
  return obj === null || obj === undefined || Number.isNaN(obj);
}


function _mapValues<TMapperArgument>(obj: unknown, mapper: (val: TMapperArgument) => unknown, visited: unknown[], options: MapValuesOptions): unknown {

  if (visited.includes(obj)) return obj;

  const { predicate, ignoreEmpty } = options;

  if (ignoreEmpty && (obj === null || obj === undefined)) return obj;

  if ((typeof obj === 'string' || isEmptyLimited(obj) || Object.keys(Object(obj)).length === 0) && !Array.isArray(obj)) { // eslint-disable-line unicorn/new-for-builtins
    if (!predicate || predicate(obj)) return mapper(obj as TMapperArgument);

    return obj;
  }

  visited.push(obj);

  const result = lodashMapValues(obj as object, (o) => _mapValues(o, mapper, visited, options));

  if (Array.isArray(obj)) return Object.values(result);

  return result;
}

/**
 * Makes a deep mapping of all properties in an object, or cells in array based on a mapper function. This includes nested objects and arrays.
 * Similar to lodash's mapValues, but with the added ability to map arrays and performs deep recursion, while safe from circular referencing.
 *
 * @param {unknown} obj The object which properties to map
 * @param {(val: TMapperArgument) => unknown} mapper The mapping function to affect on each property
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
export default function mapValues<TMapperArgument>(obj: unknown, mapper: (val: TMapperArgument) => unknown, options?: MapValuesOptions): unknown {

  const { predicate } = options || {};
  const ignoreEmpty = options?.ignoreEmpty ?? true;

  if (obj === null || obj === undefined) return obj;

  if (Object.keys(Object(obj)).length === 0 && !Array.isArray(obj)) return obj; // eslint-disable-line unicorn/new-for-builtins

  return _mapValues(obj, mapper, [], { predicate, ignoreEmpty });
}
