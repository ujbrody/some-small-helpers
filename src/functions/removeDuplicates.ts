import areEqual, { type AreEqualOptions } from './areEqual';

/**
 * Options for {@link removeDuplicates}. All properties are optional.
 */
export interface RemoveDuplicatesOptions<T> {
  /**
   * Custom equality. Return `true` if the two items are duplicates.
   * When set, overrides `props` and default deep equality. Third parameter is the full input array.
   */
  comparisonFunc?: (item1: T, item2: T, arr?: readonly T[]) => boolean;

  /**
   * For object items only: compare only these keys to detect duplicates.
   * Ignored for primitives and Dates. Ignored when `comparisonFunc` is set.
   */
  props?: string[];

  /**
   * When comparing nested arrays inside objects, treat same elements in any order as equal.
   * Only used when `comparisonFunc` is not set. Default `true`.
   */
  ignoreArrayOrder?: boolean;

  /**
   * When two items are equal, choose which to keep. Called as `selector(existing, current, fullArray)`.
   * Return &lt; 0 to keep current, &gt; 0 to keep existing, 0 to use `keepWhenEqual`.
   */
  selector?: (item1: T, item2: T, arr?: readonly T[]) => number;

  /**
   * When two items are equal and there is no selector (or selector returns 0):
   * `'first'` keep first occurrence, `'second'` keep second. Default `'first'`.
   */
  keepWhenEqual?: 'first' | 'second';
}


function isObjectLike(x: unknown): x is object {
  return x !== null && typeof x === 'object';
}


/**
 * Removes duplicate items from an array and returns a new array. Does not mutate the input.
 *
 * Works with primitives, plain objects, class instances, and `Date` values. When two items are
 * considered equal, one is kept according to `options.selector` or `options.keepWhenEqual`.
 * If the input is not an array, it is returned unchanged.
 *
 * @param val - The array to deduplicate. Passed as-is if not an array.
 * @param options - Optional configuration.
 * @param options.comparisonFunc - Custom equality. Return `true` if two items are duplicates.
 *   When set, `props` and default equality are ignored. Third parameter is the full input array.
 * @param options.props - For object items only: compare only these keys to detect duplicates.
 *   Ignored for primitives/Dates. Ignored when `comparisonFunc` is set. If omitted, all keys are compared.
 * @param options.ignoreArrayOrder - When comparing nested arrays inside objects, treat same elements in
 *   any order as equal. Default `true`. Only used when `comparisonFunc` is not set.
 * @param options.selector - When two items are equal, keep the "better" one. Called as
 *   `selector(existing, current, fullArray)`. Return &lt; 0 to keep current, &gt; 0 to keep existing,
 *   or 0 to use `keepWhenEqual`. When the selector keeps the current item, it is placed at the end of the result.
 * @param options.keepWhenEqual - When two items are equal and there is no selector or selector returns 0:
 *   `'first'` (default) keep the first occurrence, `'second'` keep the second (later one moves to end).
 * @returns A new array with duplicates removed. New reference; input is unchanged.
 *
 * @example Primitives
 * removeDuplicates([1, 1, 2, 2, 3]);
 * // => [1, 2, 3]
 *
 * @example Objects with specific props
 * const arr = [
 *   { street: '1234 Place', city: 'Atlanta', state: 'GA' },
 *   { street: '1234 Place', city: 'Atlanta', state: 'Georgia' },
 *   { street: '1234 Place', city: 'San Francisco', state: 'CA' }
 * ];
 * removeDuplicates(arr, { props: ['street', 'city'] });
 * // => [ { street: '1234 Place', city: 'Atlanta', state: 'GA' }, { street: '1234 Place', city: 'San Francisco', state: 'CA' } ]
 *
 * @example Custom comparison (comparisonFunc)
 * removeDuplicates([1, 'one', 1, 2], { comparisonFunc: (a, b) => a === b });
 * // => [1, 'one', 2]
 *
 * @example Picking which duplicate to keep (selector)
 * const people = [
 *   { id: 1, name: 'Bob', age: 42 },
 *   { id: 2, name: 'Rick', age: 30 },
 *   { id: 1, name: 'Bob', age: 50 }
 * ];
 * removeDuplicates(people, {
 *   props: ['id'],
 *   selector: (a, b) => a.age - b.age  // keep the one with higher age
 * });
 * // => [ { id: 2, name: 'Rick', age: 30 }, { id: 1, name: 'Bob', age: 50 } ]
 *
 * @example Keeping second when equal (keepWhenEqual)
 * removeDuplicates(['a', 'b', 'a'], { keepWhenEqual: 'second' });
 * // => ['b', 'a']
 *
 * @example Nested array order (ignoreArrayOrder)
 * const arr = [
 *   { key: 'x', items: [1, 2, 3] },
 *   { key: 'x', items: [3, 2, 1] }
 * ];
 * removeDuplicates(arr);  // default ignoreArrayOrder: true
 * // => [ { key: 'x', items: [1, 2, 3] } ]
 * removeDuplicates(arr, { ignoreArrayOrder: false });
 * // => both objects kept (different array order)
 */
export default function removeDuplicates<T>(val: readonly T[], options?: RemoveDuplicatesOptions<T>): T[] {
  const op: Required<Pick<RemoveDuplicatesOptions<T>, 'keepWhenEqual'>> &
    Omit<RemoveDuplicatesOptions<T>, 'keepWhenEqual'> = {
      keepWhenEqual: options?.keepWhenEqual ?? 'first',
      comparisonFunc: options?.comparisonFunc,
      props: options?.props,
      ignoreArrayOrder: options?.ignoreArrayOrder ?? true,
      selector: options?.selector
    };

  if (!Array.isArray(val)) return val as T[];

  const areItemsEqual = (a: T, b: T): boolean => {
    if (op.comparisonFunc) return op.comparisonFunc(a, b, val);

    const bothObjects = isObjectLike(a) && isObjectLike(b);

    const areEqualOptions: AreEqualOptions = {
      ignoreArrayOrder: op.ignoreArrayOrder,
      comparisonProps: bothObjects ? (op.props ?? []) : []
    };

    return areEqual(a, b, areEqualOptions);
  };

  const shouldKeepSecondWhenEqual = (existing: T, current: T): boolean => {
    if (op.selector) {
      const decision = op.selector(existing, current, val);

      if (decision < 0) return true; // keep current
      if (decision > 0) return false; // keep existing
      // decision === 0 -> fall through to keepWhenEqual
    }

    return op.keepWhenEqual === 'second';
  };

  const result: T[] = [];
  for (const current of val) {
    const existingIndex = result.findIndex((x) => areItemsEqual(x, current));

    if (existingIndex === -1) {
      result.push(current);
    } else {
      const existing = result[existingIndex] as T;

      if (shouldKeepSecondWhenEqual(existing, current)) {
        // keep second -> remove the first occurrence and append the current
        result.splice(existingIndex, 1);
        result.push(current);
      }
      // keep first -> do nothing
    }
  }
  return result;
}
