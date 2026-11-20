import type AnyClass from '~types/AnyClass';

interface DetermineArrayTypeOptions {
  verboseObjects?: 'all' | 'none' | 'top-level';
  identifyClasses?: AnyClass[];
  ignoreCustomClassNames?: boolean;
  nullIsEmpty?: boolean;
  discoverTypes?: {
    predicate: (value: unknown) => boolean;
    discoveredType: string;
  }[];
}

/**
 * Internal recursion state.
 * `path` holds the arrays and objects currently being traversed (the active ancestors), so that revisiting one
 * of them can be reported as a cycle instead of recursing forever. Entries are removed when traversal unwinds,
 * so a value referenced repeatedly in separate branches is not mistaken for a cycle.
 */
interface Context {
  path: Set<object>;
}

const CIRCULAR = '<circular>';


/*
 * Built-in identification (used only under `ignoreCustomClassNames`)
 * ===================================================================
 * Built-ins are recognized by what a value actually is, not by its constructor name or `Symbol.toStringTag`,
 * so a user-defined class named `Date` is not mistaken for the built-in `Date`.
 *
 * Most types are recognized with a "brand check": an intrinsic method or getter that only succeeds when the value
 * has that built-in's internal slot. These checks never run user code (not even Proxy traps), work across realms,
 * and also recognize user-defined subclasses, which carry the base type's internal slot.
 * The Error family and `Promise` have no such check and are recognized through the prototype chain instead.
 *
 * Intrinsics are captured once, when the module loads. Types the runtime does not provide are skipped.
 */

type Intrinsic = (this: unknown, ...args: unknown[]) => unknown;

const runtimeGlobals = globalThis as unknown as Record<string, unknown>;

function asIntrinsic(candidate: unknown): Intrinsic | undefined {
  return typeof candidate === 'function' ? candidate as Intrinsic : undefined;
}

function prototypeOfGlobal(name: string): object | undefined {
  const constructor = runtimeGlobals[name];
  if (typeof constructor !== 'function') {
    return undefined;
  }
  const { prototype } = constructor as { prototype?: unknown };
  return typeof prototype === 'object' && prototype !== null ? prototype : undefined;
}

function intrinsicGetter(prototype: object | undefined, key: PropertyKey): Intrinsic | undefined {
  return prototype ? asIntrinsic(Object.getOwnPropertyDescriptor(prototype, key)?.get) : undefined;
}

function intrinsicMethod(prototype: object | undefined, key: string): Intrinsic | undefined {
  return prototype ? asIntrinsic(Object.getOwnPropertyDescriptor(prototype, key)?.value) : undefined;
}

// Each check throws a TypeError unless the value has the corresponding internal slot.
const BRAND_CHECKS: { label: string; check: Intrinsic | undefined; args: unknown[] }[] = [
  { label: 'Date', check: intrinsicMethod(Date.prototype, 'getTime'), args: [] },
  { label: 'RegExp', check: intrinsicGetter(RegExp.prototype, 'source'), args: [] },
  { label: 'Map', check: intrinsicGetter(Map.prototype, 'size'), args: [] },
  { label: 'Set', check: intrinsicGetter(Set.prototype, 'size'), args: [] },
  { label: 'WeakMap', check: intrinsicMethod(WeakMap.prototype, 'has'), args: [{}] },
  { label: 'WeakSet', check: intrinsicMethod(WeakSet.prototype, 'has'), args: [{}] },
  { label: 'ArrayBuffer', check: intrinsicGetter(ArrayBuffer.prototype, 'byteLength'), args: [] },
  { label: 'SharedArrayBuffer', check: intrinsicGetter(prototypeOfGlobal('SharedArrayBuffer'), 'byteLength'), args: [] },
  // `buffer` rather than `byteLength`, which also throws for a view over a detached buffer
  { label: 'DataView', check: intrinsicGetter(DataView.prototype, 'buffer'), args: [] },
  { label: 'Number', check: intrinsicMethod(Number.prototype, 'valueOf'), args: [] },
  { label: 'String', check: intrinsicMethod(String.prototype, 'valueOf'), args: [] },
  { label: 'Boolean', check: intrinsicMethod(Boolean.prototype, 'valueOf'), args: [] },
  { label: 'BigInt', check: intrinsicMethod(prototypeOfGlobal('BigInt'), 'valueOf'), args: [] },
  { label: 'Symbol', check: intrinsicMethod(Symbol.prototype, 'valueOf'), args: [] },
];

// The intrinsic %TypedArray%.prototype[Symbol.toStringTag] getter returns the element type name from the internal slot,
// or undefined (without throwing) for anything that is not a typed array.
const typedArrayTag = intrinsicGetter(Object.getPrototypeOf(Int8Array.prototype) as object, Symbol.toStringTag);

const TYPED_ARRAY_NAMES = new Set([
  'Int8Array', 'Uint8Array', 'Uint8ClampedArray',
  'Int16Array', 'Uint16Array',
  'Int32Array', 'Uint32Array',
  'Float16Array', 'Float32Array', 'Float64Array',
  'BigInt64Array', 'BigUint64Array',
]);

// Standard error prototypes, mapped to their labels. Error.prototype is matched last, as the common ancestor.
const ERROR_PROTOTYPE_LABELS = new Map<object, string>();
for (const name of ['TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'EvalError', 'URIError', 'AggregateError', 'SuppressedError', 'Error']) {
  const prototype = prototypeOfGlobal(name);
  if (prototype) {
    ERROR_PROTOTYPE_LABELS.set(prototype, name);
  }
}

// Error.isError checks the internal slot (cross-realm, no user code). It is not available on every runtime.
const isErrorIntrinsic = asIntrinsic((Error as unknown as Record<string, unknown>).isError);

function passesBrandCheck(check: Intrinsic, value: object, args: unknown[]): boolean {
  try {
    Reflect.apply(check, value, args);
    return true;
  } catch (error) {
    // Only the brand check's own failure means "not this type". The check runs no user code, but rethrow anything else.
    if (error instanceof TypeError) {
      return false;
    }
    throw error;
  }
}

function identifyError(value: object): string | undefined {
  // Without Error.isError, fall back to instanceof (same realm only; may run Proxy traps, whose errors propagate)
  const isError = isErrorIntrinsic ? Reflect.apply(isErrorIntrinsic, undefined, [value]) === true : value instanceof Error;
  if (!isError) {
    return undefined;
  }
  // Report the nearest standard error type in the prototype chain: a subclass of TypeError is a 'TypeError'
  for (let prototype = Object.getPrototypeOf(value) as object | null; prototype !== null; prototype = Object.getPrototypeOf(prototype) as object | null) {
    const label = ERROR_PROTOTYPE_LABELS.get(prototype);
    if (label) {
      return label;
    }
  }
  // An error from another realm: its prototypes are not this realm's intrinsics
  return 'Error';
}

/**
 * Returns the label of a supported JavaScript built-in, or `undefined` when the value is not one of them.
 * User-defined subclasses report the built-in they extend.
 */
function identifyBuiltIn(value: object): string | undefined {
  for (const { label, check, args } of BRAND_CHECKS) {
    if (check && passesBrandCheck(check, value, args)) {
      return label;
    }
  }

  const tag = typedArrayTag ? Reflect.apply(typedArrayTag, value, []) : undefined;
  if (typeof tag === 'string' && TYPED_ARRAY_NAMES.has(tag)) {
    return tag;
  }

  const errorLabel = identifyError(value);
  if (errorLabel) {
    return errorLabel;
  }

  // No side-effect-free brand check exists for Promise: same realm only, may run Proxy traps
  if (value instanceof Promise) {
    return 'Promise';
  }

  return undefined;
}


/**
 * Returns the `discoveredType` of the first `discoverTypes` entry whose predicate matches the value.
 * Later predicates are not evaluated once one matches. Errors thrown by predicates propagate unchanged.
 */
function discoverType(value: unknown, options: DetermineArrayTypeOptions | undefined): string | undefined {
  for (const { predicate, discoveredType } of options?.discoverTypes ?? []) {
    if (predicate(value)) {
      return discoveredType;
    }
  }
  return undefined;
}


function getDetailedType(value: unknown, options: DetermineArrayTypeOptions | undefined, depth: number, context: Context, skipDiscovery = false): string {
  // Caller-provided discovery takes precedence over everything else.
  // skipDiscovery is set when the caller has already run discovery on this exact value.
  if (!skipDiscovery) {
    const discovered = discoverType(value, options);
    if (discovered !== undefined) {
      return discovered;
    }
  }

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

      // Following an array that is already being traversed would recurse forever
      if (context.path.has(value)) {
        return CIRCULAR;
      }

      // Determine the type of the array's contents
      const innerType = determineArrayTypeInternal(value, options, context); // eslint-disable-line @typescript-eslint/no-use-before-define

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

    // Ignore custom class names: supported built-ins keep their label, every other object is just 'object'.
    // Such objects are never expanded, so verboseObjects does not apply to them.
    if (options?.ignoreCustomClassNames) {
      return identifyBuiltIn(value) ?? 'object';
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
      // Expanding an object that is already being traversed would recurse forever
      if (context.path.has(value)) {
        return CIRCULAR;
      }

      // Create a new context with increased depth for recursive calls
      const newDepth = depth + 1;

      context.path.add(value);
      try {
        // Get object properties and their types
        const keys = Object.keys(value) as (keyof typeof value)[];
        if (keys.length === 0) {
          return '{}'; // Empty object
        }

        const properties = keys.map((key) => {
          const propType = getDetailedType(value[key], options, newDepth, context);
          return `${key}: ${propType}`;
        });

        return `{ ${properties.join(', ')} }`;
      } finally {
        context.path.delete(value);
      }
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
  return determineArrayTypeInternal(arr, options, { path: new Set() }); // eslint-disable-line @typescript-eslint/no-use-before-define
}


function determineArrayTypeInternal(arr: unknown, options: DetermineArrayTypeOptions | undefined, context: Context): string {
  if (!Array.isArray(arr)) {
    return 'not an array';
  }

  // Handle empty array case
  if (arr.length === 0) {
    return 'empty';
  }

  // Mark this array as being traversed for the duration of its classification
  context.path.add(arr);
  try {
    return classifyArrayLevel(arr, options, context); // eslint-disable-line @typescript-eslint/no-use-before-define
  } finally {
    context.path.delete(arr);
  }
}


/**
 * What is known about one cell of the array being classified.
 * Array identity is tracked separately from the label: a non-array whose discovered label is '[number]' is not an array.
 */
interface Cell {
  value: unknown;
  // Set for discovered cells and for arrays (whose label is needed to tell whether they are wildcards); otherwise computed on demand
  label?: string;
  // A discoverTypes predicate supplied the label
  matched: boolean;
  isArray: boolean;
  // undefined, or null under nullIsEmpty (not discovered)
  isAbsent: boolean;
  // An array, not discovered, whose own type carries no element evidence (see isWildcardArrayLabel)
  isArrayWildcard: boolean;
}


function isRegularObject(value: unknown): boolean {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && (!value.constructor || value.constructor.name === 'Object');
}


/**
 * Whether an array's label carries no element evidence: '[empty]', '[undefined]', '[null]' under nullIsEmpty,
 * or any of these nested further ('[[undefined]]'), since an array of wildcards is itself a wildcard.
 */
function isWildcardArrayLabel(label: string, nullIsEmpty: boolean): boolean {
  const emptyKinds = nullIsEmpty ? ['empty', 'undefined', 'null'] : ['empty', 'undefined'];
  let inner = label;
  while (inner.startsWith('[') && inner.endsWith(']')) {
    inner = inner.slice(1, -1);
    if (emptyKinds.includes(inner)) {
      return true;
    }
  }
  return false;
}


function describeCells(arr: unknown[], options: DetermineArrayTypeOptions | undefined, context: Context): Cell[] {
  const nullIsEmpty = options?.nullIsEmpty === true;

  // Discovery runs on every cell first, so each predicate sees each cell exactly once
  const discovered = arr.map((value) => discoverType(value, options));

  return arr.map((value, index) => {
    const discoveredLabel = discovered[index];
    const matched = discoveredLabel !== undefined;
    const isArray = Array.isArray(value);
    const label = matched || !isArray ? discoveredLabel : getDetailedType(value, options, 0, context, true);
    return {
      value,
      label,
      matched,
      isArray,
      isAbsent: !matched && (value === undefined || (nullIsEmpty && value === null)),
      isArrayWildcard: !matched && isArray && isWildcardArrayLabel(label as string, nullIsEmpty),
    };
  });
}


/**
 * Classifies one array level (the array is known to be non-empty):
 * 1. every cell gets a label (discovered, or its full classification);
 * 2. wildcards are removed: absent cells (undefined, null under nullIsEmpty) whenever another cell is present,
 *    and wildcard arrays ('[empty]', '[undefined]', '[null]' under nullIsEmpty, at any depth) whenever a real array is present;
 * 3. the remaining labels are compared: identical labels give that label, anything else a mix.
 */
function classifyArrayLevel(arr: unknown[], options: DetermineArrayTypeOptions | undefined, context: Context): string {
  const cells = describeCells(arr, options, context);
  const present = cells.filter((cell) => !cell.isAbsent && !cell.isArrayWildcard);

  // Only wildcards: report the kind of emptiness
  if (present.length === 0) {
    const arrayWildcards = cells.filter((cell) => cell.isArrayWildcard);
    if (arrayWildcards.length > 0) {
      // An empty array is still an array, so absent cells never make its parent 'empty'
      const [{ label: firstLabel }] = arrayWildcards;
      return arrayWildcards.every((cell) => cell.label === firstLabel) ? firstLabel as string : '[empty]';
    }
    if (cells.every((cell) => cell.value === undefined)) {
      return 'undefined';
    }
    if (cells.every((cell) => cell.value === null)) {
      return 'null';
    }
    return 'empty';
  }

  // Wildcard arrays only give way to a real array. A discovered empty array does not count as one.
  const hasRealArray = present.some((cell) => cell.isArray && !(cell.matched && (cell.value as unknown[]).length === 0));
  const remaining = cells.filter((cell) => !cell.isAbsent && (!cell.isArrayWildcard || !hasRealArray));

  // Plain objects (none discovered) are compared by their keys, and described by the first one.
  // Under ignoreCustomClassNames objects are compared by their final label instead.
  if (!options?.ignoreCustomClassNames && remaining.every((cell) => !cell.matched && isRegularObject(cell.value))) {
    const [first] = remaining;
    const firstKeys = Object.keys(first.value as object).sort().join(',');
    if (remaining.some((cell) => Object.keys(cell.value as object).sort().join(',') !== firstKeys)) {
      return 'mixed object';
    }
    return getDetailedType(first.value, options, 0, context, true);
  }

  // Compare the final labels
  const labelOf = (cell: Cell) => cell.label ?? getDetailedType(cell.value, options, 0, context, true);
  const firstLabel = labelOf(remaining[0]);
  for (const cell of remaining.slice(1)) {
    if (labelOf(cell) !== firstLabel) {
      // Arrays of different element types (none discovered) keep the '[mix]' notation
      return remaining.every((other) => other.isArray && !other.matched) ? '[mix]' : 'mix';
    }
  }
  return firstLabel;
}
