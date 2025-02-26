import isEmpty from './isEmpty';


/**
 * Similar to the split method of JS string, only it performs the split only once - on the first occurrence of the divider
 * This means that this function always returns array with at the most only two cell
 * @param str The string to split
 * @param divider The character (or string) used as a divider between the two part
 * @returns Array of only two cells - first cell is before the first divider, the second cell is the rest of the string
 */
export default function splitFirst(str: string, divider: string): string[] {

  if (isEmpty(str)) return [];

  const split = str.split(divider);
  const first = split.shift();

  if (split.length > 1 || !isEmpty(split[0])) return [first as string, split.join(divider)];

  return [first as string];
}