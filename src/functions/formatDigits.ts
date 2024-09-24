function extractDigits(str: string) {
  return str.replace(/\D/g, ''); // eslint-disable-line unicorn/prefer-string-replace-all
}

function amountOfPounds(strWithPounds: string) {
  return strWithPounds.split('#').length - 1;
}


interface FormatDigitsOptions {
  failedOutput?: 'empty' | 'original' | 'digits';
  incompleteFormat?: boolean;
}

const defaultOptions: Required<FormatDigitsOptions> = {
  failedOutput: 'empty',
  incompleteFormat: true
};


/**
 * Takes a string that should include digit characters (numbers from 0 to 9) and a format, and returns a string of all the digits formatted according to the given format
 *
 * ```typescript
 * expect(formatDigits('1+23abc4567$890==', '(###) ###-####`)).toBe('(123) 456-7890);
 * ```
 *
 * Options:
 * ========
 * `incompleteFormat`
 * ------------------
 * *Defaults to* `true`
 * If there are not enough digits in the string to fill up the entire format, when this option is set to `true` it returns the format in incomplete form.
 * If set to `false` it treats the situation as a failure and then return the failedOutput.
 *
 * ```typescript
 * expect(formatDigits('1234567', `(###) ###-####`, { incompleteFormat: true })).toBe('(123) 456-7');
 * expect(formatDigits('1234567', `(###) ###-####`, { incompleteFormat: false })).toBe(''); // See the default behavior of failedOutput
 * ```
 *
 * `failedOutput`
 * ------------------
 * *Defaults to* "empty".
 * Dictates what should be returned in case that the formatting of the string failed. Failure happens where there are not enough digits to satisfy the format or there are not digits at all.
 *
 * It has three options:
 * `empty`: returns empty string
 * `original`: returns the original string from the argument
 * `digits`: returns only the digits from the argument
 *
 * ```typescript
 * expect(formatDigits('ABCDE', '#####`, { failedOutput: 'empty' })).toBe('');
 * expect(formatDigits('ABCDE', '#####`, { failedOutput: 'original' })).toBe('ABCDE');
 * expect(formatDigits('12++3-4', '#####`, { incompleteFormat: false, failedOutput: 'digits' })).toBe('1234');
 * ```
 * @param input A string that includes digit characters to be formatted
 * @param format The format to apply on all the digits
 * @param options Modifiers for how to apply the format on the string
 * @returns A string that contains only the digit characters from an input string in a defined format
 */
function formatDigits(input: string, format: string, options?: FormatDigitsOptions) {

  const failedOutput = options?.failedOutput || defaultOptions.failedOutput;
  const incompleteFormat = options?.incompleteFormat ?? defaultOptions.incompleteFormat;


  const digits = extractDigits(input);

  function outputOnFailure() {
    if (failedOutput === 'empty') return '';
    if (failedOutput === 'original') return input;
    return digits;
  }


  if (!digits) return outputOnFailure();

  if (digits.length < amountOfPounds(format) && !incompleteFormat) return outputOnFailure();

  let formatted = '';
  let digitIndex = 0;

  for (const char of format) {
    if (char === '#') {
      formatted += digits[digitIndex] || '';
      digitIndex += 1;
    } else {
      formatted += char;
    }
  }

  return formatted;
}

export default formatDigits;
