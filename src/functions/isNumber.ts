interface IsNumberOptions {
  allowNumericString?: boolean;
}

const defaultOptions: IsNumberOptions = {
  allowNumericString: false,
};

/**
 * Checks if a value is a valid, usable number
 *
 * ```typescript
 * expect(isNumber(0)).toBe(true);
 * expect(isNumber(42)).toBe(true);
 * expect(isNumber(-1)).toBe(true);
 * expect(isNumber(3.14)).toBe(true);
 * expect(isNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
 * expect(isNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
 * ```
 *
 * This function returns true only when given a _usable_ number value.
 * For other values that might be considered technically numbers, it will return false.
 *
 * ```typescript
 * expect(isNumber('123')).toBe(false);
 * expect(isNumber(NaN)).toBe(false);
 * expect(isNumber(Infinity)).toBe(false);
 * ```
 *
 * Optional Modifiers:
 * ===================
 * `allowNumericString`
 * -------------------
 * *Defaults to* `false`  
 * When set to `true`, the function will return `true` for numeric strings.
 *
 * ```typescript
 * expect(isNumber('123', { allowNumericString: true })).toBe(true);
 * expect(isNumber('123.45', { allowNumericString: true })).toBe(true);
 * expect(isNumber('-123.45', { allowNumericString: true })).toBe(true);
 * ```
 * @param value - Any value to check
 * @param options - Optional modifiers
 * @returns true if the value is a usable number, false otherwise
 */
export function isNumber(value: unknown, options?: IsNumberOptions): value is number {
  const { allowNumericString } = {
    allowNumericString: options?.allowNumericString || defaultOptions.allowNumericString,
  };

  if (allowNumericString && typeof value === 'string' && !Number.isNaN(Number(value))) return true;

  // Check if value is number type and not NaN
  if (typeof value !== 'number' || Number.isNaN(value)) return false;

  // Check for infinite values
  if (!Number.isFinite(value)) return false;

  return true;
} 