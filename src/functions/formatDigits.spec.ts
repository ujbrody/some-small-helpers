import formatDigits from './formatDigits';


/**
 * formatDigits TESTS
 *
 * @group unit/formatDigits
 * @group only
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

  it.skip('continue with the next characters in format until reaching a missing digit if there are not enough digits and lastDigitEnds is set to `false`', () => {
    expect(true).toBeTruthy();
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

  it.skip('returns the formatted digits only up to the amount that satisfy the format if more digits are given than needed for the format as default behavior', () => {
    expect(true).toBeTruthy();
  });

  it.skip('returns the formatted digits with the rest of the digits concatenated if `expand` option is set to `true`', () => {
    expect(true).toBeTruthy();
  });

  it.skip('includes leading and trailing 0s in the output as default behavior', () => {
    expect(true).toBeTruthy();
  });

  it.skip('trims leading and trailing  0s from the final output if `trim` option is set to `true`', () => {
    expect(true).toBeTruthy();
  });

  it.skip('trims only leading 0s when `trim` option is set to "leading"', () => {
    expect(true).toBeTruthy();
  });

  it.skip('trims only trailing 0s when `trim` option is set to "trailing"', () => {
    expect(true).toBeTruthy();
  });

  it.skip('returns a single 0 if all the digits are 0 (in all trimming options)', () => {
    expect(true).toBeTruthy();
  });
});
