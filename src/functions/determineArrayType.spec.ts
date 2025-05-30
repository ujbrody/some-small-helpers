import determineArrayType from './determineArrayType';


/**
 * determineArrayType TESTS
 *
 * @group unit/determineArrayType
 */


describe('determineArrayType', () => {
  // Test for non-array input
  test('should return "not an array" for non-array inputs', () => {
    expect(determineArrayType(null)).toBe('not an array');
    expect(determineArrayType(undefined)).toBe('not an array'); // eslint-disable-line unicorn/no-useless-undefined
    expect(determineArrayType(123)).toBe('not an array');
    expect(determineArrayType('string')).toBe('not an array');
    expect(determineArrayType({})).toBe('not an array');
    expect(determineArrayType(() => {})).toBe('not an array');
  });

  // Test for empty array
  test('should return "empty" for an empty array', () => {
    expect(determineArrayType([])).toBe('empty');
  });

  // Test arrays with primitive types
  test('should return "string" for array of strings', () => {
    expect(determineArrayType(['a', 'b', 'c'])).toBe('string');
  });

  test('should return "number" for array of numbers', () => {
    expect(determineArrayType([1, 2, 3])).toBe('number');
  });

  test('should return "boolean" for array of booleans', () => {
    expect(determineArrayType([true, false, true])).toBe('boolean');
  });

  // Test arrays with special JavaScript types
  test('should return "null" for array of nulls', () => {
    expect(determineArrayType([null, null])).toBe('null');
  });

  test('should return "undefined" for array of undefined', () => {
    expect(determineArrayType([undefined, undefined])).toBe('undefined');
  });

  test('should return "symbol" for array of symbols', () => {
    expect(determineArrayType([Symbol('a'), Symbol('b')])).toBe('symbol');
  });

  test('should return "function" for array of functions', () => {
    expect(determineArrayType([() => {}, function () {}])).toBe('function');
  });

  // Test arrays of objects
  test('should return the object type for array of identical objects', () => {
    expect(determineArrayType([{ a: 1 }, { a: 2 }])).toBe('{ a: number }');
  });

  test('should return "mixed object" for array of different objects', () => {
    expect(determineArrayType([{}, { a: 1 }])).toBe('mixed object');
    expect(determineArrayType([{ a: 1 }, { b: 2 }])).toBe('mixed object');
    expect(determineArrayType([{ a: 1, b: 2 }, { a: 1, b: 2, c: 3 }])).toBe('mixed object');
  });

  test('should return class name for array of custom class instances', () => {
    class TestClass {}
    expect(determineArrayType([new TestClass(), new TestClass()])).toBe('TestClass');
  });

  // Test arrays of arrays (nested arrays)
  test('should return "[number]" for array of number arrays', () => {
    expect(determineArrayType([[1, 2], [3, 4]])).toBe('[number]');
  });

  test('should return "[empty]" for array of empty arrays', () => {
    expect(determineArrayType([[], []])).toBe('[empty]');
  });

  // Test typed arrays
  test('should return typed array class name for arrays of typed arrays', () => {
    expect(determineArrayType([new Uint8Array([1, 2]), new Uint8Array([3, 4])])).toBe('Uint8Array');
    expect(determineArrayType([new Int32Array([1, 2]), new Int32Array([3, 4])])).toBe('Int32Array');
  });

  // Test mixed arrays
  test('should return "mix" for array with mixed types', () => {
    expect(determineArrayType([1, 'string'])).toBe('mix');
    expect(determineArrayType([true, 123, null])).toBe('mix');
    expect(determineArrayType([{}, []])).toBe('mix');
    expect(determineArrayType([[1, 2], ['a', 'b']])).toBe('[mix]');
  });

  // Test arrays with some empty arrays
  test('should ignore empty arrays when determining type of array of arrays', () => {
    // Array with number arrays and empty arrays should identify as [number]
    expect(determineArrayType([[1, 2], [], [3, 4]])).toBe('[number]');
    // Array with string arrays and empty arrays should identify as [string]
    expect(determineArrayType([['a', 'b'], [], ['c', 'd']])).toBe('[string]');
    // Array with empty arrays and one non-empty array should identify as the non-empty type
    expect(determineArrayType([[], [true, false], []])).toBe('[boolean]');
    // Array with only empty arrays should still be identified as [empty]
    expect(determineArrayType([[], [], []])).toBe('[empty]');
    // Array with different types of non-empty arrays should still return [mix]
    expect(determineArrayType([[1, 2], [], ['a', 'b']])).toBe('[mix]');
  });

  // Test the verboseObjects option
  describe('verboseObjects option', () => {
    test('should display object properties with verboseObjects set to "top-level"', () => {
      const obj = { name: 'test', value: 123, fn() {}, nested: { prop: true } };
      // Default is "top-level"
      expect(determineArrayType([obj, obj])).toBe('{ name: string, value: number, fn: function, nested: object }');
      // Explicitly set to "top-level"
      expect(determineArrayType([obj, obj], { verboseObjects: 'top-level' }))
        .toBe('{ name: string, value: number, fn: function, nested: object }');
    });

    test('should display nested object properties with verboseObjects set to "all"', () => {
      const obj = { name: 'test', nested: { prop: true } };
      expect(determineArrayType([obj, obj], { verboseObjects: 'all' }))
        .toBe('{ name: string, nested: { prop: boolean } }');
    });

    test('should not display object properties with verboseObjects set to "none"', () => {
      const obj = { name: 'test', value: 123, nested: { prop: true } };
      expect(determineArrayType([obj, obj], { verboseObjects: 'none' })).toBe('object');
    });
  });

  describe('identifyClasses option', () => {
    test('should identify classes by their name', () => {
      class BaseTestClass {}

      class TestClass extends BaseTestClass {}

      expect(determineArrayType([new TestClass(), new TestClass()])).toBe('TestClass');
      expect(determineArrayType([new TestClass(), new TestClass()], { identifyClasses: [BaseTestClass] })).toBe('BaseTestClass');
    });
  });
});
