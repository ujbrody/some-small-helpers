import omitBy from 'lodash/omitBy';
import mapValues from 'lodash/mapValues';
import has from 'lodash/has';

import isEmpty from './isEmpty';


interface CleanEmptyOptions {
  completelyRemove?: boolean;
  replaceWith?: any;
}

/**
 * Takes an object or array the remove from it all properties (for object) or cell (for Array) that are empty
 * For any other other type it simply returns it
 * Empty is any type that will return `true` for `isEmpty` function.
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
 * @param obj Object to clean
 * @param options Options to modify the behavior of the function
 * @returns The object without all empty fields
 */
export default function cleanEmpty(obj: any, options?: CleanEmptyOptions): any {

  const completelyRemove = options?.completelyRemove === undefined ? true : options.completelyRemove;
  const replaceWith = options && has(options, 'replaceWith') ? options.replaceWith : null;

  if (Array.isArray(obj)) {
    let returnValue = obj.map((item) => cleanEmpty(item, { completelyRemove, replaceWith }));

    returnValue = completelyRemove
      ? returnValue.filter((item) => !isEmpty(item))
      : returnValue.map((item) => (isEmpty(item) ? replaceWith : item));

    return returnValue;
  }

  if (typeof obj !== typeof 'string' && Object.keys(obj || {}).length > 0) {
    const returnValue = completelyRemove
      ? omitBy(
        mapValues(obj, (prop) => cleanEmpty(prop)),
        isEmpty
      )
      : mapValues(obj, (prop) => (isEmpty(prop) ? replaceWith : cleanEmpty(prop, { completelyRemove, replaceWith })));

    return returnValue;
  }

  return obj;
}
