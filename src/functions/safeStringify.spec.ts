/* eslint-disable unicorn/no-useless-undefined, unicorn/consistent-function-scoping */

import safeStringify from './safeStringify';


/**
 * safeStringify TESTS
 *
 * @group unit/safeStringify
 */


describe('safeJsonStringify', () => {

  it('stringifies primitive values correctly', async () => {
    expect(safeStringify(1)).toBe('1');
    expect(safeStringify('string')).toBe('"string"');
    expect(safeStringify(true)).toBe('true');
    expect(safeStringify(false)).toBe('false');
    expect(safeStringify(null)).toBe('null');
    expect(safeStringify(undefined)).toBe('undefined');
  });

  it('stringifies Maps correctly', () => {
    const map = new Map([['a', 1], ['b', 2]]);
    expect(safeStringify(map)).toBe('Map(["a",1],["b",2])');
  });

  it('stringifies Sets correctly', () => {
    const set = new Set([1, 2, 3]);
    expect(safeStringify(set)).toBe('Set(1,2,3)');
  });

  it('stringifies TypedArrays correctly', () => {
    const int8Array = new Int8Array([1, 2, 3]);
    const int16Array = new Int16Array([1, 2, 3]);
    const int32Array = new Int32Array([1, 2, 3]);
    const uint8Array = new Uint8Array([1, 2, 3]);
    const unit8ClampedArray = new Uint8ClampedArray([1, 2, 3]);
    const uint16Array = new Uint16Array([1, 2, 3]);
    const uint32Array = new Uint32Array([1, 2, 3]);
    const float32Array = new Float32Array([1, 2, 3]);
    const float64Array = new Float64Array([1, 2, 3]);

    expect(safeStringify(uint8Array)).toBe('Uint8Array([1,2,3])');
    expect(safeStringify(int32Array)).toBe('Int32Array([1,2,3])');
    expect(safeStringify(unit8ClampedArray)).toBe('Uint8ClampedArray([1,2,3])');
    expect(safeStringify(int16Array)).toBe('Int16Array([1,2,3])');
    expect(safeStringify(uint16Array)).toBe('Uint16Array([1,2,3])');
    expect(safeStringify(int8Array)).toBe('Int8Array([1,2,3])');
    expect(safeStringify(uint32Array)).toBe('Uint32Array([1,2,3])');
    expect(safeStringify(float32Array)).toBe('Float32Array([1,2,3])');
    expect(safeStringify(float64Array)).toBe('Float64Array([1,2,3])');
  });

  it('stringifies BigInt64Arrays and BigUint64Arrays correctly', () => {
    const bigInt64Array = new BigInt64Array([1n, 2n, 3n]);
    const bigUint64Array = new BigUint64Array([1n, 2n, 3n]);

    expect(safeStringify(bigInt64Array)).toBe('BigInt64Array([1,2,3])');
    expect(safeStringify(bigUint64Array)).toBe('BigUint64Array([1,2,3])');
  });

  it('stringifies custom iterables correctly', () => {
    function* generator() {
      yield 1;
      yield 2;
      yield 3;
    }
    expect(safeStringify(generator())).toBe('[1,2,3]');
  });

  it('stringifies functions by outputting their content', () => {
    const arrowFunc = () => 'hello';
    function func() { return 'hello'; } // eslint-disable-line @stylistic/brace-style
    const obj = {
      anonArrowFunc: () => 'hello',
      anonFunc: function () { return 'hello'; } // eslint-disable-line object-shorthand, @stylistic/brace-style
    };

    expect(safeStringify(arrowFunc)).toBe("() => 'hello'");
    expect(safeStringify(func)).toBe("function func() { return 'hello'; }");
    expect(safeStringify(obj.anonArrowFunc)).toBe("() => 'hello'");
    expect(safeStringify(obj.anonFunc)).toBe("function () { return 'hello'; }");
  });

  it('stringifies symbols correctly', () => {
    const sym = Symbol('test');
    expect(safeStringify(sym)).toBe('Symbol(test)');
  });

  it('handles regular JSON-serializable objects', () => {
    const obj = { a: 1, b: 'string', c: true };
    expect(safeStringify(obj)).toBe('{"a":1,"b":"string","c":true}');
  });

  it('handles arrays correctly', () => {
    const arr = [1, 'string', true];
    expect(safeStringify(arr)).toBe('[1,"string",true]');
  });

  it('handles null and undefined', () => {
    expect(safeStringify(null)).toBe('null');
    expect(safeStringify(undefined)).toBe('undefined');
  });

  it('handles circular references gracefully', () => {
    const obj: { a: number; self?: unknown } = { a: 1 };
    obj.self = obj;
    expect(safeStringify(obj)).toBe('{"a":1,"self":<<CIRCULAR>>}');
  });

  it('falls back to String() for non-JSON-serializable values', () => {
    const fn = () => 'hello';
    expect(safeStringify(fn)).toBe(fn.toString());
  });

  it('returns "undefined" for undefined properties in objects', () => {
    expect(safeStringify(undefined)).toBe('undefined');
  });

  it('returns the string "undefined" when given undefined even when removeUndefined is true', () => {
    expect(safeStringify(undefined, { removeUndefined: true })).toBe('undefined');
  });

  it('keeps undefined properties when removeUndefined is false', () => {
    const obj = { a: 1, b: undefined };
    expect(safeStringify(obj, { removeUndefined: false })).toBe('{"a":1,"b":undefined}');
  });

  it('remove properties from objects that are undefined when removeUndefined is true', () => {
    const obj = { a: 1, b: undefined };
    expect(safeStringify(obj, { removeUndefined: true })).toBe('{"a":1}');
  });

  it('removes array cells that are undefined when removeUndefined is true', () => {
    const arr = [1, undefined, 3];
    expect(safeStringify(arr, { removeUndefined: true })).toBe('[1,3]');
  });

  it('handles nested objects and arrays', () => {
    const obj = { a: [1, { b: 2 }, [3, 4]], c: { d: 5 } };
    expect(safeStringify(obj)).toBe('{"a":[1,{"b":2},[3,4]],"c":{"d":5}}');
  });

  it('handles empty objects and arrays', () => {
    expect(safeStringify({})).toBe('{}');
    expect(safeStringify([])).toBe('[]');
  });

  it('handles special characters in strings', () => {
    expect(safeStringify('Hello\nWorld')).toBe(String.raw`"Hello\nWorld"`);
    expect(safeStringify('Tab\tCharacter')).toBe(String.raw`"Tab\tCharacter"`);
  });

  it('handles Infinity and NaN', () => {
    expect(safeStringify(Infinity)).toBe('null');
    expect(safeStringify(Number.NaN)).toBe('null');
  });

  it('handles Boolean objects', () => {
    expect(safeStringify(Boolean(true))).toBe('true');
    expect(safeStringify(Boolean(false))).toBe('false');
  });

  it('handles Number objects', () => {
    expect(safeStringify(Number(1))).toBe('1');
  });

  it('handles String objects', () => {
    expect(safeStringify(String('text'))).toBe('"text"');
  });

  it('handles custom objects with circular references', () => {
    const obj: { a: number; self?: unknown } = { a: 1 };
    obj.self = obj;
    expect(safeStringify(obj)).toBe('{"a":1,"self":<<CIRCULAR>>}');
  });

  it('handles custom objects with non-enumerable properties', () => {
    const obj = {};
    Object.defineProperty(obj, 'hidden', {
      value: 'secret',
      enumerable: false
    });
    expect(safeStringify(obj)).toBe('{}');
  });

  it('handles custom objects with symbol properties', () => {
    const sym = Symbol('key');
    const obj = { [sym]: 'value' };
    expect(safeStringify(obj)).toBe('{}');
  });

  it('sorts contents of arrays when option is set', async () => {
    const arr = [3, 1, 2];
    expect(safeStringify(arr, { sortContents: true })).toBe('[1,2,3]');
  });

  it('sorts contents of objects when option is set', async () => {
    const obj = { c: 3, a: 1, b: 2 };
    expect(safeStringify(obj, { sortContents: true })).toBe('{"a":1,"b":2,"c":3}');
  });

  it('stringifies DataView without throwing (ArrayBuffer view that is not iterable)', () => {
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);

    expect(() => safeStringify(view)).not.toThrow();
    expect(safeStringify(view)).toBe('{}');
  });

  it('stringifies non-array custom iterables (object with Symbol.iterator)', () => {
    const iterableObj = {
      *[Symbol.iterator]() {
        yield 1;
        yield 2;
        yield 3;
      }
    };

    expect(safeStringify(iterableObj)).toBe('[1,2,3]');
  });
});
