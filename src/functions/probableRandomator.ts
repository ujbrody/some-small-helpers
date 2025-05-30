import probabilityArray from './probabilityArray';

/**
 * Takes a list of items and their probability (from 100) and return a function that can always return one of these
 * items randomly. The list includes ratios, in order to set the probability that any one of the items should come up
 *
 * @param {ProbabilityItem<T>[]} args A list of items that are the pool from which to choose randomly with their probability
 * @returns {() => T} A function object that generate a random number from given pool every time it is invoked
 *
 * @example
 * ```typescript
 * const randomator = probableRandomator(['foo', 0.3], ['bar', 0.6], ['blah', 0.1]);
 * const foo: string[] = [];
 * const bar: string[] = [];
 * const blah: string[] = [];
 *
 * for (let i = 0; i < 1000; i += 1) {
 *   const item = randomator();
 *
 *   if (item === 'foo') {
 *     foo.push(item);
 *   }
 *   if (item === 'bar') {
 *     bar.push(item);
 *   }
 *   if (item === 'blah') {
 *     blah.push(item);
 *   }
 * }
 *
 * expect(bar.length).toBeGreaterThan(foo.length);
 * expect(foo.length).toBeGreaterThan(blah.length);
 * ```
 */
export default function probableRandomator<T>(...args: [T, number][]): () => T {

  const arr = probabilityArray(...args);

  return () => {
    const index = Math.floor(Math.random() * arr.length);

    return arr[index];
  };
}
