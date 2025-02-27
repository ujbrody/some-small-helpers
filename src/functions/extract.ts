import findIndex from 'lodash/findIndex';
import pullAt from 'lodash/pullAt';


/**
 * Extracts (removes and returns) the first element from an array that matches the given predicate.
 * Modifies the original array by removing the matched element.
 * 
 * @template T The type of elements in the array
 * @param {T[]} array The array to extract from
 * @param {(item: T) => boolean} predicate Function that returns true for the element to extract
 * @returns {T | undefined} The extracted element or undefined if no match is found
 * 
 * @example
 * const numbers = [1, 2, 3, 4];
 * const even = extract(numbers, n => n % 2 === 0);
 * // even: 2
 * // numbers is now: [1, 3, 4]
 * 
 * @example
 * const users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}];
 * const bob = extract(users, user => user.name === 'Bob');
 * // bob: {id: 2, name: 'Bob'}
 * // users is now: [{id: 1, name: 'Alice'}]
 */
export default function extract<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
  const foundIndex = findIndex(array, predicate);
  if (foundIndex === -1) {
    return undefined;
  }
  return pullAt(array, foundIndex)[0];
}
