import { isDate } from './isDate';

describe('isDate', () => {

  it('should return true for valid Date objects', () => {
    expect(isDate(new Date())).toBe(true);
    expect(isDate(new Date('2024-03-14'))).toBe(true);
    expect(isDate(new Date(2024, 2, 14))).toBe(true);
  });

  it('should return false for Invalid Date objects', () => {
    expect(isDate(new Date('invalid'))).toBe(false);
    expect(isDate(new Date('2024-13-45'))).toBe(false);
  });

  it('should return false for non-Date values', () => {
    expect(isDate(null)).toBe(false);
    expect(isDate(undefined)).toBe(false);
    expect(isDate({})).toBe(false);
    expect(isDate('2024-03-14')).toBe(false);
    expect(isDate(42)).toBe(false);
    expect(isDate(['2024-03-14'])).toBe(false);
  });

  it('should return true for Invalid Date objects when allowInvalidDate is true', () => {
    expect(isDate(new Date('invalid'), { allowInvalidDate: true })).toBe(true);
    expect(isDate(new Date('2024-13-45'), { allowInvalidDate: true })).toBe(true);
  });
  

  it('should return false for Invalid Date objects when allowInvalidDate is false', () => {
    expect(isDate(new Date('invalid'), { allowInvalidDate: false })).toBe(false);
    expect(isDate(new Date('2024-13-45'), { allowInvalidDate: false })).toBe(false);
  });
});