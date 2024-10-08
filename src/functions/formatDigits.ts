import trim from 'lodash/trim';
import trimStart from 'lodash/trimStart';
import trimEnd from 'lodash/trimEnd';


function extractDigits(str: string) {
  return str.replace(/\D/g, ''); // eslint-disable-line unicorn/prefer-string-replace-all
}

function amountOfPounds(strWithPounds: string) {
  return strWithPounds.split('#').length - 1;
}


interface FormatDigitsOptions {
  failedOutput?: 'empty' | 'original' | 'digits';
  incompleteFormat?: boolean;
  lastDigitEnds?: boolean;
  trim?: boolean;
  extension?: boolean | string;
  trimZeros?: boolean | 'leading' | 'trailing';
  placeholder?: string;
}

const defaultOptions: Required<FormatDigitsOptions> = {
  failedOutput: 'empty',
  incompleteFormat: true,
  lastDigitEnds: true,
  trim: true,
  extension: false,
  trimZeros: false,
  placeholder: '#'
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
 *
 * `lastDigitEnds`
 * --------------
 * *Defaults to* `true`.
 * When set to `true`, if the digits string is too short, the last digit in the string always ends the output string.
 * When set to false, either the last digit of the string, or the last character in the format before the next digit placeholder ends the string—depending on who comes last
 *
 * ```typescript
 * expect(formatDigits('123456', '(###) ###-####', { lastDigitEnds: true })).toBe('(123) 456');
 * expect(formatDigits('123456', '(###) ###-####', { lastDigitEnds: false })).toBe('(123) 456-');
 * expect(formatDigits('123456', '(###) ###---####', { lastDigitEnds: false })).toBe('(123) 456---');
 * ```
 *
 * `extension`
 * ----------
 * *Defaults to* `false`
 * When set to `true`, if the digits input is longer than the amount of placeholders in the format, the rest of the digits are concatenated to the end of the formatted output.
 * This option could also have a string value, which represents the separator between the formatted output and the concatenated digits stream
 *
 * ```typescript
 * expect(formatDigits('1234567890666', formatPhone, { extension: false })).toBe('(123) 456-7890');
 * expect(formatDigits('1234567890666', formatPhone, { extension: true })).toBe('(123) 456-7890666');
 * expect(formatDigits('1234567890666', formatPhone, { extension: ' x' })).toBe('(123) 456-7890 x666');
 * ```
 *
 * `trimZeros`
 * ----------
 * *Defaults to* `false`
 * Can receive a boolean value or 'leading' or 'trailing' value
 * Dictates whether leading zeros, trailing zeros or zeros from both ends will be removed from the digits string *before* applying the format over it.
 * If the entire digits string includes nothing but zeros, it will convert it to a string of a single zero '0'.
 *
 * ```typescript
 * expect(formatDigits('0012340', formatThousand)).toBe('00,123.40'); // default: trimZeros === false
 * expect(formatDigits('0012340', formatThousand, { trimZeros: true })).toBe('12,34');
 * expect(formatDigits('0012340', formatThousand, { trimZeros: 'leading' })).toBe('12,340');
 * expect(formatDigits('0012340', formatThousand, { trimZeros: 'trailing' })).toBe('00,123.4');
 * expect(formatDigits('0000000000', formatThousand, { trimZeros: true })).toBe('0');
 * ```
 *
 * `placeholder`
 * ------------
 * *Defaults to* '#'
 * Define what character or string will be used to represent the placeholder for digits in the format.
 * Default value will be used if the given placeholder value is empty string
 *
 * ```typescript
 * expect(formatDigits('123456', '??#??#??', { placeholder: '?' })).toBe('12#34#56');
 * expect(formatDigits('1234', '?$#?$?$#?$', { placeholder: '?$' })).toBe('1#23#4');
 * expect(formatDigits('1234567890', formatPhone, { placeholder: '' })).toBe('(123) 456-7890');
 * ```
 * @param input A string that includes digit characters to be formatted
 * @param format The format to apply on all the digits
 * @param options Modifiers for how to apply the format on the string
 * @returns A string that contains only the digit characters from an input string in a defined format
 */
function formatDigits(input: string, format: string, options?: FormatDigitsOptions) {

  const failedOutput = options?.failedOutput || defaultOptions.failedOutput;
  const incompleteFormat = options?.incompleteFormat ?? defaultOptions.incompleteFormat;
  const lastDigitEnds = options?.lastDigitEnds ?? defaultOptions.lastDigitEnds;
  const trimSpace = options?.trim ?? defaultOptions.trim;
  const toExtend = !!options?.extension;
  let separator = '';
  const trimLeadingZeros = (options?.trimZeros && options?.trimZeros !== 'trailing') ? '0' : '';
  const trimTrailingZeros = (options?.trimZeros && options?.trimZeros !== 'leading') ? '0' : '';
  const placeholder = options?.placeholder || defaultOptions.placeholder;


  const tmp = extractDigits(input);
  let digits = trimStart(trimEnd(tmp, trimTrailingZeros), trimLeadingZeros);

  if (!digits && tmp) {
    digits = '0';
  }

  function outputOnFailure() {
    if (failedOutput === 'empty') return '';
    if (failedOutput === 'original') return input;
    return digits;
  }


  if (!digits) return outputOnFailure();

  if (digits.length < amountOfPounds(format) && !incompleteFormat) return outputOnFailure();

  let formatted = '';
  let digitIndex = 0;
  let toBreak = false;

  let i = 0;
  while (i < format.length) {
    const segment = format.slice(i, i + placeholder.length);

    if (segment === placeholder) {
      i += placeholder.length;

      if (toBreak) break;

      formatted += digits[digitIndex] || '';
      digitIndex += 1;

      if (digitIndex >= digits.length) {
        if (lastDigitEnds) break;

        toBreak = true;
      }
    } else {
      formatted += format[i];
      i += 1;
    }
  }

  if (digitIndex < digits.length && toExtend) {

    if (typeof options?.extension === 'string') {
      separator = options!.extension!;
    }

    const extension = digits.slice(digitIndex);
    formatted += `${separator}${extension}`;
  }

  return trimSpace ? trim(formatted) : formatted;
}

export default formatDigits;
