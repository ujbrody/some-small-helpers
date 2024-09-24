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
});
