/**
 * Splits a string by a divider while preserving substrings within quotation marks.
 *
 * @param {string} str The string to split
 * @param {string} divider The divider to split by
 *
 * @example
 * ```typescript
 * const str = 'one|two("three|four")|five';
 *
 * expect(awareSplit(str, '|')).toEqual(['one', 'two("three|four")', 'five']);
 * ```
 */
export default function awareSplit(str: string, divider: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < str.length; i += 1) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : '';

    // Handle quote toggling, accounting for escaped quotes
    if (char === '"' && prevChar !== '\\') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }

    // If we encounter the divider and we're not in quotes, split the string
    if (char === divider && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    // Otherwise, just add the character to the current segment
    current += char;
  }

  // Don't forget to add the last segment
  result.push(current);

  return result;
}
