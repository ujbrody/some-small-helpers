import type AnyClass from '~types/AnyClass';

interface DetermineArrayTypeOptions {
  verboseObjects?: 'all' | 'none' | 'top-level';
  identifyClasses?: AnyClass[];
}


function getDetailedType(value: unknown, options?: DetermineArrayTypeOptions, depth = 0): string {
  const verboseObjects = options?.verboseObjects ?? 'top-level';
  // Handle null separately since typeof null returns 'object'
  if (value === null) {
    return 'null';
  }

  // Handle undefined
  if (value === undefined) {
    return 'undefined';
  }

  // Check for Symbol
  if (typeof value === 'symbol') {
    return 'symbol';
  }

  // Check for Function
  if (typeof value === 'function') {
    return 'function';
  }

  // Handle primitives (string, number, boolean)
  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return typeof value;
  }

  // At this point, we're dealing with objects
  if (typeof value === 'object') {
    // Check for Arrays first (which are also objects)
    if (Array.isArray(value)) {
      // If array is empty, return [empty]
      if (value.length === 0) {
        return '[empty]';
      }

      // Determine the type of the array's contents
      const innerType = determineArrayType(value, options); // eslint-disable-line @typescript-eslint/no-use-before-define

      // Return [type] notation
      return `[${innerType}]`;
    }

    // Check for instances of classes specified in identifyClasses option
    if (options?.identifyClasses && options.identifyClasses.length > 0) {
      for (const classToCheck of options.identifyClasses) {
        if (value instanceof classToCheck) {
          return classToCheck.name;
        }
      }
    }

    // Handle TypedArrays
    const typedArrayTypes = [
      'Int8Array', 'Uint8Array', 'Uint8ClampedArray',
      'Int16Array', 'Uint16Array',
      'Int32Array', 'Uint32Array',
      'Float32Array', 'Float64Array',
      'BigInt64Array', 'BigUint64Array'
    ];

    const constructorName = value.constructor ? value.constructor.name : '';

    if (typedArrayTypes.includes(constructorName)) {
      return constructorName;
    }

    // Handle other class instances
    if (constructorName && constructorName !== 'Object') {
      return constructorName;
    }

    // Handling for generic objects based on verboseObjects option
    if (verboseObjects === 'none') {
      return 'object';
    }

    // Check if we should be verbose about this object
    const shouldBeVerbose = verboseObjects === 'all' || (verboseObjects === 'top-level' && depth === 0);

    if (shouldBeVerbose) {
      // Create a new context with increased depth for recursive calls
      const newDepth = depth + 1;

      // Get object properties and their types
      const keys = Object.keys(value) as (keyof typeof value)[];
      if (keys.length === 0) {
        return '{}'; // Empty object
      }

      const properties = keys.map((key) => {
        const propType = getDetailedType(value[key], options, newDepth);
        return `${key}: ${propType}`;
      });

      return `{ ${properties.join(', ')} }`;
    }
    // Not verbose at this level
    return 'object';
  }

  // Return the type for anything else
  return typeof value;
}


/**
 * Determines the type of an array by checking the type of its elements. The returned types are as follows:
 *
 * - `empty`: The array is empty.
 * - `number`: The array contains only numbers.
 * - `string`: The array contains only strings.
 * - `boolean`: The array contains only booleans.
 * - `function`: The array contains only functions.
 * - `symbol`: The array contains only symbols.
 * - `null`: The array contains only null.
 * - `undefined`: The array contains only undefined.
 * - `mixed`: The array contains a mix of types.
 *
 * If the array contains arrays, then similar rules apply only they are returned in square brackets:
 *
 * - `[empty]`: The array is empty.
 * - `[number]`: The array contains only numbers.
 * - `[string]`: The array contains only strings.
 * - etc.
 *
 * If the array contains instances of classes, then the type returned is the name of the class.
 *
 * If the array contains objects, then the type returned is the type of the first object in the array.
 * The syntax the function uses to describe the object depends on the `verboseObjects` option.
 *
 * @param {unknown} arr - The array to determine the type of.
 * @param {DetermineArrayTypeOptions} options - Options for type determination.
 * @returns {string} - The type of the array.
 *
 * @example
 * ```typescript
 * const arr = [1, 'test', () => {}];
 * const type = determineArrayType(arr);
 *
 * expect(type).toBe('[number, string, function]');
 * ```
 *
 * Options
 * =======
 * `verboseObjects`
 * -------------
 * *Defaults to* `'top-level'`
 *
 * When set to `'top-level'` the function will only show the type of the first object in the array.
 * When set to `'all'` the function will show the type of all objects in the array.
 * When set to `'none'` the function will not show the type of the objects in the array.
 *
 * @example
 * ```typescript
 * const arr = [{a: 1, b: { c: 3 }}, {a: 3, b: { c: 4 }}];
 * const type = determineArrayType(arr, { verboseObjects: 'all' });
 *
 * expect(type).toBe('{ a: number, b: { c: number } }');
 *
 * const arr2 = [{a: 1, b: { c: 3 }}, {a: 3, b: { c: 4 }}];
 * const type2 = determineArrayType(arr2, { verboseObjects: 'top-level' });
 *
 * expect(type2).toBe('{ a: number, b: object }');
 *
 * const arr3 = [{a: 1, b: { c: 3 }}, {a: 3, b: { c: 4 }}];
 * const type3 = determineArrayType(arr3, { verboseObjects: 'none' });
 *
 * expect(type3).toBe('object');
 * ```
 *
 * *Note:* Regardless of the `verboseObjects` option, if the structure of the objects in the array are different, the function will always return `'mixed object'`.
 *
 * `identifyClasses`
 * ----------------
 * *Defaults to* `[]`
 *
 * An array of classes that the function will identify and return the name of the class.
 * This option takes precedence over returning the class name, and therefore allows to target base classes:
 *
 * @example
 * ```typescript
 * class BaseClass {}
 * class SubClass extends BaseClass {}
 *
 * const arr = [new BaseClass(), new SubClass()];
 *
 * expect(determineArrayType(arr)).toBe('SubClass');
 * expect(determineArrayType(arr, { identifyClasses: [BaseClass] })).toBe('BaseClass');
 * ```
 */
export default function determineArrayType(arr: unknown, options?: DetermineArrayTypeOptions) {

  if (!Array.isArray(arr)) {
    return 'not an array';
  }

  // Handle empty array case
  if (arr.length === 0) {
    return 'empty';
  }
  // Special handling for arrays of arrays where some might be empty
  let nonEmptyArraysType: string | null = null;
  let hasArrays = false;
  let hasNonEmptyArrays = false;
  // First check if we're dealing with an array of arrays
  for (const item of arr) {
    if (Array.isArray(item)) {
      hasArrays = true;
      // Skip empty arrays
      if (item.length === 0) {
        continue;
      }
      hasNonEmptyArrays = true;
      // Get the type of this non-empty array
      const arrayType = getDetailedType(item, options);
      if (nonEmptyArraysType === null) {
        // This is the first non-empty array we've found
        nonEmptyArraysType = arrayType;
      } else if (nonEmptyArraysType !== arrayType) {
        // If we find different types among non-empty arrays, return [mix]
        return '[mix]';
      }
    }
  }
  // If we found arrays and some were non-empty, return the determined type
  if (hasArrays && hasNonEmptyArrays && nonEmptyArraysType !== null) {
    return nonEmptyArraysType;
  }
  // Special handling for arrays of objects
  // First check if all elements are objects (not arrays, null or class instances)
  let allObjects = true;
  for (const item of arr) {
    const isRegularObject = typeof item === 'object'
      && item !== null
      && !Array.isArray(item)
      && (!item.constructor || item.constructor.name === 'Object');
    if (!isRegularObject) {
      allObjects = false;
      break;
    }
  }
  // If all elements are regular objects, handle their property comparison
  if (allObjects) {
    // Get the keys of the first object as a reference
    const firstObjKeys = Object.keys(arr[0]).sort().join(',');
    // Check if all objects have the same keys
    for (let i = 1; i < arr.length; i += 1) {
      const currentObjKeys = Object.keys(arr[i]).sort().join(',');
      if (currentObjKeys !== firstObjKeys) {
        // If objects have different structures, return "[mixed object]"
        return 'mixed object';
      }
    }
    // All objects have the same structure, return the detailed type of the first one
    return getDetailedType(arr[0], options);
  }
  // If all arrays were empty, or we're not dealing with arrays of arrays,
  // fall back to the original logic
  // Get the type of the first element to compare with others
  const firstType = getDetailedType(arr[0], options);
  // Check if all elements have the same type
  for (let i = 1; i < arr.length; i += 1) {
    if (getDetailedType(arr[i], options) !== firstType) {
      return 'mix';
    }
  }
  // If we've made it here, all elements have the same type
  return firstType;
}
