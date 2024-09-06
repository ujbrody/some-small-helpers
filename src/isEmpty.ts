/* eslint-disable @typescript-eslint/no-explicit-any */

interface IsEmptyOptions {
  emptyStringIsEmpty?: boolean;
  whitespaceIsEmpty?: boolean;
  zeroIsEmpty?: boolean;
  falseIsEmpty?: boolean;
  treatMapsAsObjects?: boolean;
}

const defaultIsEmptyOptions: IsEmptyOptions = {
  emptyStringIsEmpty: true,
  whitespaceIsEmpty: true,
  zeroIsEmpty: false,
  falseIsEmpty: false,
  treatMapsAsObjects: true
};


// The recursive mechanism of the function includes a `passed` array that stored all reference types
// This is to prevent infinite loop in case that arguments include within them circular references
function _isEmpty(val: any, passed: any[], settings: IsEmptyOptions): boolean {

  const { emptyStringIsEmpty, whitespaceIsEmpty, zeroIsEmpty, falseIsEmpty, treatMapsAsObjects } = settings;

  if (typeof val === 'string') {
    const result = whitespaceIsEmpty ? val.trim() : val;

    if (emptyStringIsEmpty) return !result;

    return false;
  }

  if (typeof val === typeof 1 && !zeroIsEmpty) {
    return Number.isNaN(val);
  }

  if (typeof val === typeof true && !falseIsEmpty) {
    return false;
  }

  if (!val) return true;

  if (passed.includes(val)) return true; // circular referencing
  passed.push(val);

  if (Array.isArray(val) || val instanceof Set || (val instanceof Map && !treatMapsAsObjects)) {
    return [...val].every((v) => _isEmpty(v, passed, settings));
  }

  if (val instanceof Map) {
    return [...val].every((v) => _isEmpty(v[1], passed, settings));
  }

  if (val.toString() === '[object Object]') {
    // We check using the `toString` method instead of `typeof` because we want other object, like Date, Error and RegEx to not be considered empty

    return Object.values(val).every((v) => _isEmpty(v, passed, settings));
  }

  return false;
}

/**
 * Returns true if argument is one of the followings:
 * - `null`
 * - `undefined`
 * - empty string
 * - empty array, or array that includes only empty cells (by the definitions of the function)
 * - empty object, or object which all its properties are empty (by the definition of the function)
 * - `NaN`
 *
 * Optional Modifiers:
 * ===================
 * `emptyStringIsEmpty`
 * -------------------
 * *defaults to* `true`
 * When set to `false` it will look at all strings, no matter the content, as non-empty value.
 *
 * ```typescript
 * expect(isEmpty('', { emptyStringIsEmpty: false })).toBe(false);
 * ```
 *
 * `zeroIsEmpty`
 * ------------
 * *defaults to* `false`
 * When set to `false` all number (with the exception of NaN) will be considered non-empty values
 *
 * ```typescript
 * expect(isEmpty(0)).toBe(false);
 * expect(isEmpty(0, { zeroIsEmpty: true })).toBe(true);
 * ```
 *
 * `falseIsEmpty`
 * -------------
 * *defaults to* `false`
 * When set to `false` both boolean values - `true` and `false` will be considered non-empty values
 *
 * ```typescript
 * expect(isEmpty(false)).toBe(false);
 * expect(isEmpty(false, { falseIsEmpty: true })).toBe(true);
 * ```
 *
 * `treatMapsAsObjects`
 * -------------------
 * *defaults to* `true`
 * When true, Map is treated like objects, when the keys are ignored, and only values are checked for data
 *
 * ```typescript
 * const emptyMap = new Map();
 * const fullyEmptyMap = new Map();
 *
 * emptyMap.set('prop', '');
 * fullyEmptyMap.set(null, '');
 *
 * expect(isEmpty(emptyMap)).toBe(true);
 * expect(isEmpty(emptyMap, { treatMapsAsObjects: false })).toBe(false);
 * expect(isEmpty(fullyEmptyMap)).toBE(true);
 * expect(isEmpty(fullyEmptyMap, { treatMapsAsObjects: false })).toBe(true);
 * ```
 * @param val The value to check
 * @param options (optional) modifies the definitions of what is considered empty and what is not
 * @returns Indication if the value is empty
 */
export default function isEmpty(val: any, options?: IsEmptyOptions) {

  const settings = {
    ...defaultIsEmptyOptions,
    ...options
  };

  return _isEmpty(val, [], settings);
}
