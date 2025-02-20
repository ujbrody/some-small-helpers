interface IsDateOptions {
  allowInvalidDate?: boolean;
}

const defaultOptions: IsDateOptions = {
  allowInvalidDate: false,
};

/**
 * Checks if a value is a valid, usable Date object
 *
 * ```typescript
 * expect(isDate(new Date())).toBe(true);
 * expect(isDate(new Date('2024-03-14'))).toBe(true);
 * expect(isDate(new Date(2024, 2, 14))).toBe(true);
 * ```  
 *
 * This function returns true only when given a _usable_ Date object.
 * For other values that might be considered technically dates, it will return false.
 *
 * ```typescript
 * expect(isDate(new Date('invalid'))).toBe(false);
 * expect(isDate(new Date('2024-13-45'))).toBe(false);
 * ```
 *
 * Optional Modifiers:
 * ===================
 * `allowInvalidDate`
 * -------------------
 * *Defaults to* `false`
 * When set to `true`, the function will return `true` for invalid Date objects (Basically it will just verify that the value is an instance of Date)
 *
 * ```typescript
 * expect(isDate(new Date('invalid'), { allowInvalidDate: true })).toBe(true);
 * ```
 * @param value - Any value to check
 * @param options - Optional modifiers
 * @returns true if the value is a usable Date object, false otherwise
 */
export function isDate(value: unknown, options?: IsDateOptions): value is Date {
  const { allowInvalidDate } = {
    allowInvalidDate: options?.allowInvalidDate || defaultOptions.allowInvalidDate,
  };

  // Check if value is a Date object
  if (!(value instanceof Date)) {
    return false;
  }

  // Check if the date is valid (not Invalid Date)
  if (Number.isNaN(value.getTime())) {
    if (allowInvalidDate) return true;
    return false;
  }

  return true;
}
