import isEmpty from './isEmpty';

/**
 * Takes a list of items of any type and ratios, and returns an array with 100 cells.
 * All items appear in the array according to the specified ratios.
 * The items need to be provided in pairs implemented via arrays.
 *
 * ```typescript
 * const arr = probabilityArray(['foo', 0.2], ['bar', 0.3], ['boom', 0.5]);
 *
 * const foo = arr.filter((item) => item === 'foo');
 * const bar = arr.filter((item) => item === 'bar');
 * const boom = arr.filter((item) => item === 'boom');
 *
 * expect(foo).toHaveLength(20);
 * expect(bar).toHaveLength(30);
 * expect(boom).toHaveLength(50);
 * ```
 * @param args The arguments to place in the array in the desired ratio `[item, amount]`
 * @returns Array of size 100, that has all items - each in the specified quantity
 */
export default function probabilityArray<T>(...args: [T, number][]): T[] {

  let totalSum = 0;
  const arrays: T[][] = [];

  let i = 0;
  while (totalSum < 100 && i < args.length) {
    const item = args[i][0];
    let amount = Math.floor(args[i][1] * 100);

    totalSum += amount;

    if (totalSum > 100) {
      amount -= totalSum - 100;
    }
    arrays.push(Array.from({ length: amount }, () => item));

    i += 1;
  }

  const retArr: T[] = [];
  while (!isEmpty(arrays)) {
    if (arrays.length > 1) {
      arrays.forEach((arr, index, thisArr) => {
        retArr.push(arr.pop()!);

        if (arr.length === 0) {
          thisArr.splice(index, 1);
        }
      });
    } else {
      retArr.push(...arrays[0]);
      break;
    }
  }

  return retArr;
}