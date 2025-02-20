import { isNumber } from './isNumber';

describe('isNumber', () => {

  it('should return true for valid numbers', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(42)).toBe(true);
    expect(isNumber(-1)).toBe(true);
    expect(isNumber(3.14)).toBe(true);
    expect(isNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(isNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
  });

  it('should return false for NaN', () => {
    expect(isNumber(NaN)).toBe(false);
  });

  it('should return false for infinite values', () => {
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber(-Infinity)).toBe(false);
  });

  it('should return false for non-number types', () => {
    expect(isNumber('123')).toBe(false);
    expect(isNumber('abc')).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber({})).toBe(false);
    expect(isNumber([])).toBe(false);
    expect(isNumber(() => {})).toBe(false);
    expect(isNumber(true)).toBe(false);
    expect(isNumber(false)).toBe(false);
  });

  it('should return false for Date objects', () => {
    expect(isNumber(new Date())).toBe(false);
  });

  it('should return true for numeric strings when allowNumericString is true', () => {
    expect(isNumber('123', { allowNumericString: true })).toBe(true);
    expect(isNumber('123.45', { allowNumericString: true })).toBe(true);
    expect(isNumber('-123.45', { allowNumericString: true })).toBe(true);
  });

  it('should return false for numeric strings when allowNumericString is false', () => {
    expect(isNumber('123', { allowNumericString: false })).toBe(false);
    expect(isNumber('123.45', { allowNumericString: false })).toBe(false);
    expect(isNumber('-123.45', { allowNumericString: false })).toBe(false);
  });
});
