export type ClassConstructor<TInstance = object> = abstract new (...args: unknown[]) => TInstance;
export interface IsEmptyOptions {
  emptyStringIsEmpty?: boolean;
  whitespaceIsEmpty?: boolean;
  zeroIsEmpty?: boolean;
  falseIsEmpty?: boolean;
  treatMapsAsObjects?: boolean;
  skipClasses?: ReadonlyArray<ClassConstructor>;
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
function _isEmpty(val: unknown, passed: unknown[], settings: IsEmptyOptions): boolean {

  const { emptyStringIsEmpty, whitespaceIsEmpty, zeroIsEmpty, falseIsEmpty, treatMapsAsObjects, skipClasses } = settings;

  if (skipClasses && skipClasses.some((Cls) => val instanceof Cls)) return false;

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
 * @param {unknown} val The value to check
 * @param {IsEmptyOptions} options (optional) modifies the definitions of what is considered empty and what is not
 * @returns {boolean} Indication if the value is empty
 *
 * Optional Modifiers:
 * ===================
 * `emptyStringIsEmpty`
 * -------------------
 * *defaults to* `true`
 * When set to `false` it will look at all strings, no matter the content, as non-empty value.
 *
 * @example
 * ```typescript
 * expect(isEmpty('', { emptyStringIsEmpty: false })).toBe(false);
 * ```
 *
 * `zeroIsEmpty`
 * ------------
 * *defaults to* `false`
 * When set to `false` all number (with the exception of NaN) will be considered non-empty values
 *
 * @example
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
 * @example
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
 */
export default function isEmpty(val: unknown, options?: IsEmptyOptions) {

  const settings = {
    ...defaultIsEmptyOptions,
    ...options
  };

  return _isEmpty(val, [], settings);
}


/**
 * Returns the exact reverse of `isEmpty` with the added benefit of a type guard.
 * @param val The value to check
 * @param options (optional) modifiers similar to those given to the `isEmpty` function
 * @returns Indication if a value is *not* empty
 */
export function notEmpty<T>(val: T, options?: IsEmptyOptions): val is NonNullable<T> {

  return !isEmpty(val, options);
}
