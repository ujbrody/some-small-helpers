import formatDigits from './formatDigits';


/**
 * formatDigits TESTS
 *
 * @group unit/formatDigits
 */


describe('formatDigits', () => {

  const formatPhone = `(###) ###-####`;
  const formatThousand = `##,###.##`;

  it('takes a string of digits and fit them in the format', () => {
    expect(formatDigits('1234567890', formatPhone)).toBe('(123) 456-7890');
    expect(formatDigits('1234567', formatThousand)).toBe('12,345.67');
  });

  it('extracts just the digits out of a string that has both digits and other characters', () => {
    expect(formatDigits('1s23se4567yj-8?90', formatPhone)).toBe('(123) 456-7890');
    expect(formatDigits('1+23e4=[56]]]7', formatThousand)).toBe('12,345.67');
  });

  it('does not continue the format beyond the last digits as default behavior when there are not enough digits', () => {
    expect(formatDigits('1s23se456', formatPhone)).toBe('(123) 456');
  });

  it('continue with the next characters in format until reaching a missing digit if there are not enough digits and lastDigitEnds is set to `false`', () => {
    expect(formatDigits('1s2', formatThousand, { lastDigitEnds: false })).toBe('12,');
    expect(formatDigits('1s23se456', `(###) ###---####`, { lastDigitEnds: false })).toBe('(123) 456---');
  });

  it('trim blank spaces by default', () => {
    expect(formatDigits('1s23', formatPhone, { lastDigitEnds: false })).toBe('(123)');
  });

  it('does not trim blank spaces if option `trim` is set to false', () => {
    expect(formatDigits('1s23', formatPhone, { lastDigitEnds: false, trim: false })).toBe('(123) ');
  });

  it('returns empty string if the string does not contain any digits as default behavior', () => {
    expect(formatDigits('ABCDEFG', formatPhone)).toBe('');
  });

  it('returns the default output when string has no digits and `failedOutput` is set to "empty"', () => {
    expect(formatDigits('ABCDEFG', formatPhone, { failedOutput: 'empty' })).toBe('');
  });

  it('returns the original input if the string does not contain digits and the `failedOutput` is set to "original"', () => {
    expect(formatDigits('ABCDEFG', formatPhone, { failedOutput: 'original' })).toBe('ABCDEFG');
  });

  it('returns empty string if there are no digits in the string and `failedOutput==="digits"', () => {
    expect(formatDigits('ABCDEFG', formatPhone, { failedOutput: 'empty' })).toBe('');
  });

  it('returns incomplete formatted number if there are not enough digits as a default behavior', () => {
    expect(formatDigits('12345678', formatPhone)).toBe('(123) 456-78');
    expect(formatDigits('123456', formatThousand)).toBe('12,345.6');
  });

  it('returns empty string when not enough digits for the format and `incompleteFormat` option is set to `false`', () => {
    expect(formatDigits('12345678', formatPhone, { incompleteFormat: false })).toBe('');
  });

  it('returns empty string when there are not enough digits, `incompleteFormat===false` and `failedOutput="empty"`', () => {
    expect(formatDigits('12345678', formatPhone, { incompleteFormat: false, failedOutput: 'empty' })).toBe('');
  });

  it('returns the original input if not enough digits, `incompleteFormat===false` and `failedOutput=="original"`', () => {
    expect(formatDigits('1-2345+67++8', formatPhone, { incompleteFormat: false, failedOutput: 'original' })).toBe('1-2345+67++8');
  });

  it('returns only the extracted digits if not enough to complete the format, `incompleteFormat===false` and `failedOutput==="digits"`', () => {
    expect(formatDigits('1-2345+67++8', formatPhone, { incompleteFormat: false, failedOutput: 'digits' })).toBe('12345678');
  });

  it('returns the formatted digits only up to the amount that satisfy the format if more digits are given than needed for the format as default behavior', () => {
    expect(formatDigits('1234567890666', formatPhone)).toBe('(123) 456-7890');
  });

  it('returns the formatted digits with the rest of the digits concatenated if `extension` option is set to `true`', () => {
    expect(formatDigits('1234567890666', formatPhone, { extension: true })).toBe('(123) 456-7890666');
  });

  it('returns the formatted digits with the rest of the digits concatenated and some separator in between if `extension` option defines a separator', () => {
    expect(formatDigits('1234567890666', formatPhone, { extension: ' x' })).toBe('(123) 456-7890 x666');
  });

  it('includes leading and trailing 0s in the output as default behavior', () => {
    expect(formatDigits('0012340', formatThousand)).toBe('00,123.40');
  });

  it('trims leading and trailing  0s from the final output if `trimZeros` option is set to `true`', () => {
    expect(formatDigits('0012340', formatThousand, { trimZeros: true })).toBe('12,34');
  });

  it('trims only leading 0s when `trimZeros` option is set to "leading"', () => {
    expect(formatDigits('0012340', formatThousand, { trimZeros: 'leading' })).toBe('12,340');
  });

  it('trims only trailing 0s when `trimZeros` option is set to "trailing"', () => {
    expect(formatDigits('0012340', formatThousand, { trimZeros: 'trailing' })).toBe('00,123.4');
  });

  it('returns a single 0 if all the digits are 0 (in all trimming options)', () => {
    expect(formatDigits('0000000000', formatThousand, { trimZeros: true })).toBe('0');
  });

  it('uses a different character instead of # when set in the `placeholder` option', () => {
    expect(formatDigits('123456', '??#??#??', { placeholder: '?' })).toBe('12#34#56');
  });

  it('allows placeholder to be composed of multiple characters', () => {
    expect(formatDigits('1234', '?$#?$?$#?$', { placeholder: '?$' })).toBe('1#23#4');
  });

  it('uses the default placeholder when placeholder given is an empty string', () => {
    expect(formatDigits('1234567890', formatPhone, { placeholder: '' })).toBe('(123) 456-7890');
  });
});
