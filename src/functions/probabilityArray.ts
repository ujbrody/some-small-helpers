import shuffle from 'lodash/shuffle';


export type ProbabilityItem<T> = [T, number];
type SortOrder = 'incoming' | 'asc' | 'desc' | 'circular' | 'random';
type Cutoff = 'last' | 'biggest' | 'smallest' | 'normalize' | 'spread';


function copyProbabilityItems<T>(items: ProbabilityItem<T>[]): ProbabilityItem<T>[] {
  return items.map((item) => [item[0], Math.floor(item[1] * 100)]);
}


function consolidateDuplicateItems<T>(inputItems: ProbabilityItem<T>[]): ProbabilityItem<T>[] {
  const items = copyProbabilityItems(inputItems);
  const result: ProbabilityItem<T>[] = [];
  const seenItems = new Map<T, number>();

  // First pass - consolidate probabilities
  for (const [item, probability] of items) {
    if (seenItems.has(item)) {
      const index = seenItems.get(item)!;
      const [,currentProb] = result[index];
      const newProb = Math.min(currentProb + probability, 100); // Cap at 100
      result[index] = [item, newProb];
    } else {
      seenItems.set(item, result.length);
      result.push([item, probability]);
    }
  }

  // Clamp to avoid negative allocation lengths (negative totals become 0, items will not appear)
  return result.map(([item, probability]) => [item, Math.max(probability, 0)]);
}

// This function assumes that the total amounts to more than 100
function normalizeToSum100(input: number[]): number[] {

  const MIN = 1;
  const total = input.reduce((sum, n) => sum + n, 0);
  const scaled = input.map((n) => (n / total) * 100);

  // Apply floor and enforce minimum of 1
  const result = scaled.map((n) => Math.max(Math.floor(n), MIN));

  const sum = result.reduce((s, n) => s + n, 0);
  const deficit = 100 - sum;

  // Distribute remaining units fairly (starting from largest fractional parts)
  if (deficit > 0) {
    const fractions = scaled.map((n, i) => ({
      i,
      frac: n - Math.floor(n),
    }));

    // Sort by largest fractional part
    fractions.sort((a, b) => b.frac - a.frac);

    for (let i = 0; i < deficit; i += 1) {
      result[fractions[i % input.length].i] += 1;
    }
  }

  return result;
}

// This function assumes that the total amounts to more than 100
function removeEvenly(values: number[]) {

  const total = values.reduce((sum, val) => sum + val, 0);
  let excess = total - 100;

  const result = [...values]; // copy to avoid mutating input

  // Keep reducing until excess is gone
  let i = 0;
  while (excess > 0) {
    const index = i % result.length;

    if (result[index] > 1) {
      result[index] -= 1;
      excess -= 1;
    }

    i += 1;
  }

  return result;
}

function cutoffExcess<T>(allocations: T[][], cutoff: Cutoff = 'last') {

  function findCellThatIsThe() {

    switch (cutoff) {
      case 'last':
      { return allocations.at(-1); }
      case 'biggest':
      { return allocations.find((arr) => arr.length === Math.max(...allocations.map((arr) => arr.length))); }
      case 'smallest':
      { return allocations.find((arr) => arr.length === Math.min(...allocations.map((arr) => arr.length))); }
      default:
      { return; }
    }
  }

  let totalProbability = allocations.reduce((accumulator, current) => accumulator + current.length, 0);

  if (totalProbability > 100) {

    let reductionFactors: number[] | null = null;

    if (cutoff === 'normalize') {
      reductionFactors = normalizeToSum100(allocations.map((arr) => arr.length));
    }

    if (cutoff === 'spread') {
      reductionFactors = removeEvenly(allocations.map((arr) => arr.length));
    }

    if (reductionFactors) {
      for (const [index, arr] of allocations.entries()) {
        if (arr.length > reductionFactors[index]) {
          arr.length = reductionFactors[index];
        } else {
          arr.push(...Array.from({ length: reductionFactors[index] - arr.length }, () => arr[0]));
        }
      }
      return;
    }
  }

  while (totalProbability > 100) {
    const toRemove = totalProbability - 100;
    const last = findCellThatIsThe();

    if (!last) break;
    const amountToRemove = Math.min(toRemove, last.length);
    last.length = last.length - amountToRemove;

    if (last.length === 0) {
      allocations.splice(allocations.indexOf(last), 1);
    }

    totalProbability = allocations.reduce((accumulator, current) => accumulator + current.length, 0);
  }
}

function sortProbabilityItems<T>(items: ProbabilityItem<T>[], sortOrder?: SortOrder) {

  switch (sortOrder) {
    case 'asc': {
      items.sort((a, b) => a[1] - b[1]);
      break;
    }
    case 'desc': {
      items.sort((a, b) => b[1] - a[1]);
      break;
    }
    default: {
      return;
    }
  }
}


interface ProbabilityArrayOptions {
  sortOrder?: SortOrder;
  cutoff?: Cutoff;
}

type ProbabilityArrayArguments<T> =
  [...items: ProbabilityItem<T>[]] |
  [...items: ProbabilityItem<T>[], options: ProbabilityArrayOptions] |
  [ProbabilityItem<T>[], options?: ProbabilityArrayOptions];


const defaultOptions: ProbabilityArrayOptions = {
  sortOrder: 'incoming',
  cutoff: 'last',
};

function isProbabilityArrayOptions(value: unknown): value is ProbabilityArrayOptions {

  if (value === null || typeof value !== 'object') return false; // last arg is of object type (might have properties matching the options)

  if (Array.isArray(value)) return false; // options cannot be array form. Last arg might be one of the probability array items.

  const { sortOrder, cutoff } = value as ProbabilityArrayOptions;

  const sortOrderPossibleValues = ['incoming', 'asc', 'desc', 'circular', 'random'];
  const cutoffPossibleValues = ['last', 'biggest', 'smallest', 'normalize', 'spread'];

  if (sortOrder && !sortOrderPossibleValues.includes(sortOrder)) return false;
  if (cutoff && !cutoffPossibleValues.includes(cutoff)) return false;

  return true; // still might not be ProbabilityArrayOptions and won't have the matching `sortOrder` or `cutoff`, but at this point we don't care. If it doesn't match the shape we'll treat it as {}
}

function isProbabilityItem(value: unknown): value is [unknown, number] {
  return Array.isArray(value) && value.length === 2 && typeof value[1] === 'number';
}


/**
 * Takes a list of items of any type and ratios, and returns an array with 100 cells.
 * All items appear in the array according to the specified ratios.
 * The items need to be provided in pairs implemented via arrays.
 *
 * @param {ProbabilityItem<T>[]} args The arguments to place in the array in the desired ratio `[item, amount]`
 * @returns {T[]} Array of size 100, that has all items - each in the specified quantity
 *
 * @example
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
 */
export default function probabilityArray<T>(...args: ProbabilityItem<T>[]): T[];

/**
 * Takes a list of items of any type and ratios and settings definitions, and returns an array with 100 cells, constructed according to the settings.
 * All items appear in the array according to the specified ratios.
 * The items need to be provided in pairs implemented via arrays.
 *
 * @param {ProbabilityItem<T>[]} ratios An array that contains items and their ratios `[item, amount]`
 * @param {ProbabilityArrayOptions} options Options to modify the behavior of the function
 * @returns {T[]} Array of size 100, that has all items - each in the specified quantity
 *
 * @example
  * ```typescript
 * const arr = probabilityArray([['foo', 0.2], ['bar', 0.3], ['boom', 0.5]], { sortOrder: 'incoming', cutoff: 'last' });
 *
 * const foo = arr.filter((item) => item === 'foo');
 * const bar = arr.filter((item) => item === 'bar');
 * const boom = arr.filter((item) => item === 'boom');
 *
 * expect(foo).toHaveLength(20);
 * expect(bar).toHaveLength(30);
 * expect(boom).toHaveLength(50);
 * ```
 *
 * Optional Modifiers:
 * ===================
 * `sortOrder`
 * -------------------
 * *defaults to* `'incoming'`
 * Dictates the order of the items in the array according to one of five options:
 * - `'incoming'` - the items will be sorted in the order they were given in the arguments.
 * - `'asc'` - the items will be sorted in ascending order of their ratios—from the least common to the most common.
 * - `'desc'` - the items will be sorted in descending order of their ratios—from the most common to the least common.
 * - `'circular'` - the items will be sorted in a circular repetitive order, starting from the first item.
 * - `'random'` - the items will be sorted in a random order.
 *
 * @example
 * ```typescript
 * const incoming = probabilityArray([['A', 0.3], ['B', 0.2], ['C', 0.5]], { sortOrder: 'incoming' });
 * const asc = probabilityArray([['A', 0.3], ['B', 0.2], ['C', 0.5]], { sortOrder: 'asc' });
 * const desc = probabilityArray([['A', 0.3], ['B', 0.2], ['C', 0.5]], { sortOrder: 'desc' });
 * const circular = probabilityArray([['A', 0.3], ['B', 0.2], ['C', 0.5]], { sortOrder: 'circular' });
 * const random = probabilityArray([['A', 0.3], ['B', 0.2], ['C', 0.5]], { sortOrder: 'random' });
 *
 * console.log(incoming); // ['A',...,'A', 'B',...,'B', 'C',...,'C']
 * console.log(asc);      // ['B',...,'B', 'A',...,'A', 'C',...,'C']
 * console.log(desc);     // ['C',...,'C', 'A',...,'A', 'B',...,'B']
 * console.log(circular); // ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', ...]
 * console.log(random);   // ['C', 'B', 'A', 'A', 'C', 'C', 'C', 'B', 'C', ...]
 * ```
 *
 * `cutoff`
 * -------------------
 * *defaults to* `'last'`
 * Dictates the way to handle the items that exceed the 100% ratio.
 * - `'last'` - the last items in the argument will be reduced or removed.
 * - `'biggest'` - the items with the highest ratios will be reduced or removed.
 * - `'smallest'` - the items with the lowest ratios will be reduced or removed.
 * - `'normalize'` - all items will be reduced in order to reach a total of 100 while roughly preserving the ratios between them (with minimum of 1 for each item)
 * - `'spread'` - the items will be reduced by roughly the same amount, so that the total is 100.
 *
 * @example
 * ```typescript
 * const last = probabilityArray([['A', 0.2], ['B', 0.5], ['C', 0.4], ['D', 0.3]], { cutoff: 'last' });
 * const biggest = probabilityArray([['A', 0.2], ['B', 0.5], ['C', 0.4], ['D', 0.3]], { cutoff: 'biggest' });
 * const smallest = probabilityArray([['A', 0.2], ['B', 0.5], ['C', 0.4], ['D', 0.3]], { cutoff: 'smallest' });
 * const normalize = probabilityArray([['A', 0.2], ['B', 0.5], ['C', 0.4], ['D', 0.3]], { cutoff: 'normalize' });
 * const spread = probabilityArray([['A', 0.2], ['B', 0.5], ['C', 0.4], ['D', 0.3]], { cutoff: 'spread' });
 *
 * expect(last.filter((item) => item === 'C')).toHaveLength(20);
 * expect(last.filter((item) => item === 'D')).toHaveLength(0);
 *
 * expect(biggest.filter((item) => item === 'B')).toHaveLength(10);
 *
 * expect(smallest.filter((item) => item === 'A')).toHaveLength(0);
 * expect(smallest.filter((item) => item === 'D')).toHaveLength(10);
 *
 * expect(normalize.filter((item) => item === 'A')).toHaveLength(14);
 * expect(normalize.filter((item) => item === 'B')).toHaveLength(36);
 * expect(normalize.filter((item) => item === 'C')).toHaveLength(29);
 * expect(normalize.filter((item) => item === 'D')).toHaveLength(21);
 *
 * expect(spread.filter((item) => item === 'A')).toHaveLength(10);
 * expect(spread.filter((item) => item === 'B')).toHaveLength(40);
 * expect(spread.filter((item) => item === 'C')).toHaveLength(30);
 * expect(spread.filter((item) => item === 'D')).toHaveLength(20);
 * ```
 */
export default function probabilityArray<T>(ratios: ProbabilityItem<T>[], options?: ProbabilityArrayOptions): T[];

export default function probabilityArray<T>(...args: ProbabilityItem<T>[]): T[];

export default function probabilityArray<T>(
  ...args: [...items: ProbabilityItem<T>[], options: ProbabilityArrayOptions]
): T[];

export default function probabilityArray<T>(
  ratios: ProbabilityItem<T>[],
  options?: ProbabilityArrayOptions
): T[];

export default function probabilityArray<T>(...args: ProbabilityArrayArguments<T>): T[] {

  // const { sortOrder, cutoff }: ProbabilityArrayOptions = args.length >= 2 && isProbabilityArrayOptions(args.at(-1)) ? args.at(-1) as ProbabilityArrayOptions : defaultOptions;
  const lastArg = args.at(-1);
  const hasOptions = args.length >= 2 && isProbabilityArrayOptions(lastArg);

  // const ratios: ProbabilityItem<T>[] = Array.isArray(args[0]) && args[0][0] !== undefined && typeof args[0][1] === 'number'
  //   ? consolidateDuplicateItems(args)
  //   : consolidateDuplicateItems(args[0]);
  const { sortOrder, cutoff }: ProbabilityArrayOptions = hasOptions ? lastArg as ProbabilityArrayOptions : defaultOptions;

  const candidates = hasOptions ? args.slice(0, -1) : args;
  const probabilityCandidates: unknown[] = candidates.length === 1
    && Array.isArray(candidates[0])
    && !isProbabilityItem(candidates[0])
    ? candidates[0]
    : candidates;

  if (probabilityCandidates.length === 0) {
    throw new Error('Probability array requires at least one item');
  }

  const allAreProbabilityItems = probabilityCandidates.every((item) => isProbabilityItem(item));

  if (!allAreProbabilityItems) {
    throw new Error('Not all provided items are in the correct format to be used to generate probability spread `[item, amount]`');
  }

  const ratios = consolidateDuplicateItems(probabilityCandidates as ProbabilityItem<T>[]);

  if (ratios.length > 100) {
    // More than 100 elements were given so even if each has 0.01 probability, it will always be more than 100
    // We're sim;ly cutting off the last given items regardless of given options:
    ratios.length = 100;
  }

  sortProbabilityItems(ratios, sortOrder);

  const allocations: T[][] = [];

  for (const ratio of ratios) {
    const [item, amount] = ratio;

    allocations.push(Array.from({ length: amount }, () => item));
  }

  cutoffExcess(allocations, cutoff);

  let result: T[];

  switch (sortOrder) {
    case 'circular': {
      result = [];
      let circulator = 0;

      while (allocations.length > 0) {
        result.push(allocations[circulator].pop()!);

        if (allocations[circulator].length === 0) {
          allocations.splice(circulator, 1);
        } else {
          circulator += 1;
        }

        if (circulator >= allocations.length) {
          circulator = 0;
        }
      }
      break;
    }
    case 'random': {
      result = shuffle(allocations.flat());
      break;
    }
    default: {
      result = allocations.flat();
    }
  }

  return result;
}
