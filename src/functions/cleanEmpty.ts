import omitBy from 'lodash/omitBy';
import mapValues from 'lodash/mapValues';
import has from 'lodash/has';

import isEmpty, { type IsEmptyOptions } from './isEmpty';


export interface CleanEmptyOptions {
  completelyRemove?: boolean;
  replaceWith?: unknown;
  defineEmpty?: IsEmptyOptions;
}

function isKeyedEntity(value: unknown): value is Record<string, unknown> {
  return (
    value !== null
    && (typeof value === 'object' || typeof value === 'function')
    && !Array.isArray(value)
  );
}

/**
 * Takes an object or array the remove from it all properties (for object) or cells (for Array) that are empty
 * For any other other type it simply returns it
 * Empty is defined as any type that returns `true` when provided as argument to the `isEmpty` function.
 * *This function modifies the object in place*
 *
 * @param {any} obj Object to clean
 * @param {CleanEmptyOptions} options Options to modify the behavior of the function
 * @returns {any} The object without all empty fields
 *
 * Options
 * =======
 * `completelyRemove`
 * -----------------
 * (defaults to `true`) when set to true, any empty field it completely removed from the graph of the object
 * If set to `false`, the property remains in the graph but its value is replaced with the value specified in the `replaceWith` option.
 *
 * **Note:** This option is only effective to the highest-level of properties that are found empty in the tree:
 *
 * @example
 * ```typescript
 * const obj = {
 *  bar: { foo: [], boom: '' },
 *  foo: { bar: 'a', boom: {} }
 * }
 *
 * expect(cleanEmpty(obj, { completelyRemove: false })).toEqual({
 *  bar: null,
 * foo: { bar: 'a', boom: null }
 * })
 * ```
 *
 * `replaceWith`
 * -------------
 * (defaults to `null`) determines the value to be placed in any empty property. Only effective if `completelyRemove` option is set to `false`
 *
 * `defineEmpty`
 * ------------
 * (defaults to `undefined`) modifies the behavior of the internal `isEmpty` function when checking for empty values.
 * These are the same options that can be passed to the `isEmpty` function:
 *
 * @example
 * ```typescript
 * const obj = {
 *  string: '',
 *  boolean: false,
 * };
 *
 * expect(cleanEmpty(obj)).toEqual({ boolean: false});
 * expect(cleanEmpty(obj, { defineEmpty: { emptyStringIsEmpty: false, falseIsEmpty: true }})).toEqual({});
 * ```
 */
export default function cleanEmpty(obj: unknown, options?: CleanEmptyOptions): unknown {

  const completelyRemove = options?.completelyRemove ?? true;
  const replaceWith = options && has(options, 'replaceWith') ? options.replaceWith : null;
  const defineEmpty = options?.defineEmpty;

  if (defineEmpty?.skipClasses && defineEmpty.skipClasses.some((Cls) => obj instanceof Cls)) return obj;

  if (Array.isArray(obj)) {
    let returnValue = obj.map((item) => cleanEmpty(item, { completelyRemove, replaceWith, defineEmpty }));

    returnValue = completelyRemove
      ? returnValue.filter((item) => !isEmpty(item, defineEmpty))
      : returnValue.map((item) => (isEmpty(item, defineEmpty) ? replaceWith : item));

    return returnValue;
  }

  if (isKeyedEntity(obj) && Object.keys(obj || {}).length > 0) {
    const returnValue = completelyRemove
      ? omitBy(
        mapValues(obj, (prop) => cleanEmpty(prop, { defineEmpty })),
        (o) => isEmpty(o, defineEmpty)
      )
      : mapValues(obj, (prop) => (isEmpty(prop, defineEmpty) ? replaceWith : cleanEmpty(prop, { completelyRemove, replaceWith, defineEmpty })));

    return returnValue;
  }

  return obj;
}
