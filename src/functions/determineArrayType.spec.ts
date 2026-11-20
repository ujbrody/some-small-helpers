import vm from 'node:vm';
import determineArrayType from './determineArrayType';


/**
 * determineArrayType TESTS
 *
 * @group unit/determineArrayType
 */


describe('determineArrayType', () => {
  // Test for non-array input
  it('should return "not an array" for non-array inputs', () => {
    expect(determineArrayType(null)).toBe('not an array');
    expect(determineArrayType(undefined)).toBe('not an array'); // eslint-disable-line unicorn/no-useless-undefined
    expect(determineArrayType(123)).toBe('not an array');
    expect(determineArrayType('string')).toBe('not an array');
    expect(determineArrayType({})).toBe('not an array');
    expect(determineArrayType(() => {})).toBe('not an array');
  });

  // Test for empty array
  it('should return "empty" for an empty array', () => {
    expect(determineArrayType([])).toBe('empty');
  });

  // Test arrays with primitive types
  it('should return "string" for array of strings', () => {
    expect(determineArrayType(['a', 'b', 'c'])).toBe('string');
  });

  it('should return "number" for array of numbers', () => {
    expect(determineArrayType([1, 2, 3])).toBe('number');
  });

  it('should return "boolean" for array of booleans', () => {
    expect(determineArrayType([true, false, true])).toBe('boolean');
  });

  // Test arrays with special JavaScript types
  it('should return "null" for array of nulls', () => {
    expect(determineArrayType([null, null])).toBe('null');
  });

  it('should return "undefined" for array of undefined', () => {
    expect(determineArrayType([undefined, undefined])).toBe('undefined');
  });

  it('should return "symbol" for array of symbols', () => {
    expect(determineArrayType([Symbol('a'), Symbol('b')])).toBe('symbol');
  });

  it('should return "function" for array of functions', () => {
    expect(determineArrayType([() => {}, function () {}])).toBe('function');
  });

  // Test arrays of objects
  it('should return the object type for array of identical objects', () => {
    expect(determineArrayType([{ a: 1 }, { a: 2 }])).toBe('{ a: number }');
  });

  it('should return "mixed object" for array of different objects', () => {
    expect(determineArrayType([{}, { a: 1 }])).toBe('mixed object');
    expect(determineArrayType([{ a: 1 }, { b: 2 }])).toBe('mixed object');
    expect(determineArrayType([{ a: 1, b: 2 }, { a: 1, b: 2, c: 3 }])).toBe('mixed object');
  });

  it('should return class name for array of custom class instances', () => {
    class TestClass {}
    expect(determineArrayType([new TestClass(), new TestClass()])).toBe('TestClass');
  });

  // Test arrays of arrays (nested arrays)
  it('should return "[number]" for array of number arrays', () => {
    expect(determineArrayType([[1, 2], [3, 4]])).toBe('[number]');
  });

  it('should return "[empty]" for array of empty arrays', () => {
    expect(determineArrayType([[], []])).toBe('[empty]');
  });

  // Test typed arrays
  it('should return typed array class name for arrays of typed arrays', () => {
    expect(determineArrayType([new Uint8Array([1, 2]), new Uint8Array([3, 4])])).toBe('Uint8Array');
    expect(determineArrayType([new Int32Array([1, 2]), new Int32Array([3, 4])])).toBe('Int32Array');
  });

  // Test mixed arrays
  it('should return "mix" for array with mixed types', () => {
    expect(determineArrayType([1, 'string'])).toBe('mix');
    expect(determineArrayType([true, 123, null])).toBe('mix');
    expect(determineArrayType([{}, []])).toBe('mix');
    expect(determineArrayType([[1, 2], ['a', 'b']])).toBe('[mix]');
  });

  // Test arrays with some empty arrays
  it('should ignore empty arrays when determining type of array of arrays', () => {
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

    it('should display object properties with verboseObjects set to "top-level"', () => {
      const obj = { name: 'test', value: 123, fn() {}, nested: { prop: true } };
      // Default is "top-level"
      expect(determineArrayType([obj, obj])).toBe('{ name: string, value: number, fn: function, nested: object }');
      // Explicitly set to "top-level"
      expect(determineArrayType([obj, obj], { verboseObjects: 'top-level' }))
        .toBe('{ name: string, value: number, fn: function, nested: object }');
    });

    it('should display nested object properties with verboseObjects set to "all"', () => {
      const obj = { name: 'test', nested: { prop: true } };
      expect(determineArrayType([obj, obj], { verboseObjects: 'all' }))
        .toBe('{ name: string, nested: { prop: boolean } }');
    });

    it('should not display object properties with verboseObjects set to "none"', () => {
      const obj = { name: 'test', value: 123, nested: { prop: true } };
      expect(determineArrayType([obj, obj], { verboseObjects: 'none' })).toBe('object');
    });
  });

  describe('identifyClasses option', () => {
    it('should identify classes by their name', () => {
      class BaseTestClass {}

      class TestClass extends BaseTestClass {}

      expect(determineArrayType([new TestClass(), new TestClass()])).toBe('TestClass');
      expect(determineArrayType([new TestClass(), new TestClass()], { identifyClasses: [BaseTestClass] })).toBe('BaseTestClass');
    });
  });
});


/*
 * SSH-1: ignoreCustomClassNames, discoverTypes, nullIsEmpty, the unified level comparison and cycle protection
 * =============================================================================================================
 */

type Constructor = new (...args: unknown[]) => object;

// Runtime features that the es2020 TypeScript lib does not describe, looked up with availability guards
const runtime = globalThis as unknown as Record<string, unknown>;
const runtimeConstructor = (name: string) => (typeof runtime[name] === 'function' ? runtime[name] as Constructor : undefined);
const itIf = (condition: unknown) => (condition ? it : it.skip);

class A {}
class B {}
class Base {}
class Sub extends Base {}
class MyDate extends Date {}
class AppError extends Error {}
class BadInput extends TypeError {}
class MyMap extends Map {}
class Bytes extends Uint8Array {}
class MyPromise<T> extends Promise<T> {}
const FakeDate = class Date {};
class TaggedAsMap {
  // eslint-disable-next-line class-methods-use-this -- spoofs the tag a name-based check would trust
  get [Symbol.toStringTag]() {
    return 'Map';
  }
}
class Decimal {
  constructor(public value: number) {}
}

const on = { ignoreCustomClassNames: true };
const nullIsEmpty = { nullIsEmpty: true };


describe('determineArrayType: ignoreCustomClassNames', () => {

  describe('plain and custom objects', () => {

    it('required examples', () => {
      expect(determineArrayType([new A(), new B()], on)).toBe('object');
      expect(determineArrayType([{ a: 1 }, { b: 2 }], on)).toBe('object');
      expect(determineArrayType([new Date(), new Date()], on)).toBe('Date');
      expect(determineArrayType([new Map(), new Map()], on)).toBe('Map');
      expect(determineArrayType([new Date(), new Map()], on)).toBe('mix');
      expect(determineArrayType([/abc/, /xyz/], on)).toBe('RegExp');
    });

    it('property keys never matter', () => {
      expect(determineArrayType([{ a: 1 }, { a: 1, b: 2 }], on)).toBe('object');
      expect(determineArrayType([{}, { a: { b: 1 } }], on)).toBe('object');
      expect(determineArrayType([Object.create(null), {}], on)).toBe('object');
    });

    it.each([undefined, 'all', 'top-level', 'none'] as const)('verboseObjects %s does not expand objects', (verboseObjects) => {
      expect(determineArrayType([{ a: 1 }, { a: 2 }], { ...on, verboseObjects })).toBe('object');
      expect(determineArrayType([{ a: 1 }, { a: 1, b: { c: 1 } }], { ...on, verboseObjects })).toBe('object');
    });

    it('third-party-style classes are custom classes', () => {
      class ObjectId {
        constructor(public id: string) {}
      }
      expect(determineArrayType([new ObjectId('1'), new ObjectId('2')], on)).toBe('object');
    });
  });

  describe('supported built-ins', () => {
    const builtIns: [string, () => object][] = [
      ['Date', () => new Date()],
      ['RegExp', () => /x/],
      ['Map', () => new Map()],
      ['Set', () => new Set()],
      ['WeakMap', () => new WeakMap()],
      ['WeakSet', () => new WeakSet()],
      ['ArrayBuffer', () => new ArrayBuffer(1)],
      ['DataView', () => new DataView(new ArrayBuffer(1))],
      ['Int8Array', () => new Int8Array()],
      ['Uint8Array', () => new Uint8Array()],
      ['Uint8ClampedArray', () => new Uint8ClampedArray()],
      ['Int16Array', () => new Int16Array()],
      ['Uint16Array', () => new Uint16Array()],
      ['Int32Array', () => new Int32Array()],
      ['Uint32Array', () => new Uint32Array()],
      ['Float32Array', () => new Float32Array()],
      ['Float64Array', () => new Float64Array()],
      ['BigInt64Array', () => new BigInt64Array()],
      ['BigUint64Array', () => new BigUint64Array()],
      ['Number', () => new Object(1)],
      ['String', () => new Object('a')],
      ['Boolean', () => new Object(true)],
      ['BigInt', () => new Object(BigInt(1))],
      ['Symbol', () => new Object(Symbol('s'))],
      ['Error', () => new Error('e')],
      ['TypeError', () => new TypeError('e')],
      ['RangeError', () => new RangeError('e')],
      ['ReferenceError', () => new ReferenceError('e')],
      ['SyntaxError', () => new SyntaxError('e')],
      ['EvalError', () => new EvalError('e')],
      ['URIError', () => new URIError('e')],
      ['Promise', () => Promise.resolve()],
    ];

    it.each(builtIns)('%s keeps its label', (label, create) => {
      expect(determineArrayType([create(), create()], on)).toBe(label);
    });

    const guarded: [string, () => object][] = [
      ['SharedArrayBuffer', () => new (runtimeConstructor('SharedArrayBuffer') as Constructor)(1)],
      ['Float16Array', () => new (runtimeConstructor('Float16Array') as Constructor)()],
      ['AggregateError', () => new (runtimeConstructor('AggregateError') as Constructor)([])],
      ['SuppressedError', () => new (runtimeConstructor('SuppressedError') as Constructor)(null, null)],
    ];

    for (const [label, create] of guarded) {
      itIf(runtimeConstructor(label))(`${label} keeps its label where the runtime provides it`, () => {
        expect(determineArrayType([create(), create()], on)).toBe(label);
      });
    }

    it('different built-ins are a mix', () => {
      expect(determineArrayType([new Uint8Array(), new Int8Array()], on)).toBe('mix');
      expect(determineArrayType([new ArrayBuffer(1), new DataView(new ArrayBuffer(1))], on)).toBe('mix');
      expect(determineArrayType([new TypeError('e'), new RangeError('e')], on)).toBe('mix');
      expect(determineArrayType([new Uint8Array(), {}], on)).toBe('mix');
    });

    it('a DataView over a detached buffer is still a DataView', () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      structuredClone(buffer, { transfer: [buffer] });
      expect(determineArrayType([view], on)).toBe('DataView');
    });
  });

  describe('subclasses, misleading names, realms and unsupported types', () => {

    it('user-defined subclasses report the built-in base', () => {
      expect(determineArrayType([new MyDate()], on)).toBe('Date');
      expect(determineArrayType([new Date(), new MyDate()], on)).toBe('Date');
      expect(determineArrayType([new AppError('e')], on)).toBe('Error');
      expect(determineArrayType([new Error('e'), new AppError('e')], on)).toBe('Error');
      expect(determineArrayType([new BadInput('e')], on)).toBe('TypeError');
      expect(determineArrayType([new MyMap()], on)).toBe('Map');
      expect(determineArrayType([new Bytes()], on)).toBe('Uint8Array');
      expect(determineArrayType([Buffer.from('a')], on)).toBe('Uint8Array');
      expect(determineArrayType([MyPromise.resolve()], on)).toBe('Promise');
    });

    it('constructor names, toStringTag and prototypes are not trusted', () => {
      expect(determineArrayType([new FakeDate(), new FakeDate()], on)).toBe('object');
      expect(determineArrayType([new TaggedAsMap()], on)).toBe('object');
      expect(determineArrayType([Object.setPrototypeOf({}, Date.prototype)], on)).toBe('object');
      expect(determineArrayType([new Proxy(new Map(), {})], on)).toBe('object');
    });

    it('values from another realm', () => {
      const other = vm.runInNewContext('({ map: new Map(), date: new Date(), typeError: new TypeError("e"), promise: Promise.resolve() })');
      expect(determineArrayType([other.map], on)).toBe('Map');
      expect(determineArrayType([other.date], on)).toBe('Date');
      expect(determineArrayType([other.promise], on)).toBe('object');
    });

    itIf((Error as unknown as Record<string, unknown>).isError)('an error from another realm is an Error', () => {
      const other = vm.runInNewContext('new TypeError("e")');
      expect(determineArrayType([other], on)).toBe('Error');
    });

    it('deferred and host types are objects', () => {
      expect(determineArrayType([new Intl.DateTimeFormat()], on)).toBe('object');
      expect(determineArrayType([new (runtimeConstructor('WeakRef') as Constructor)({})], on)).toBe('object');
      expect(determineArrayType([new (runtimeConstructor('FinalizationRegistry') as Constructor)(() => {})], on)).toBe('object');
      expect(determineArrayType([new URL('https://example.com')], on)).toBe('object');
    });

    itIf(runtime.Temporal)('Temporal values are objects (deferred)', () => {
      const { Temporal } = runtime as { Temporal: { Now: { instant: () => object } } };
      expect(determineArrayType([Temporal.Now.instant()], on)).toBe('object');
    });
  });

  describe('mixes and nesting', () => {

    it('built-in and custom objects', () => {
      expect(determineArrayType([new Date(), new A()], on)).toBe('mix');
      expect(determineArrayType([new Map(), {}], on)).toBe('mix');
      expect(determineArrayType([new A(), { a: 1 }], on)).toBe('object');
      expect(determineArrayType([new A(), 1], on)).toBe('mix');
      expect(determineArrayType([{}, null], on)).toBe('mix');
      expect(determineArrayType([new A(), undefined], on)).toBe('object');
    });

    it('nested arrays', () => {
      expect(determineArrayType([[new Date()], [new Date()]], on)).toBe('[Date]');
      expect(determineArrayType([[new A()], [{ b: 1 }]], on)).toBe('[object]');
      expect(determineArrayType([[new Date()], [new A()]], on)).toBe('[mix]');
      expect(determineArrayType([[[new Map()]]], on)).toBe('[[Map]]');
      expect(determineArrayType([[], [new A()]], on)).toBe('[object]');
    });

    it('non-objects keep their labels', () => {
      expect(determineArrayType([null, null], on)).toBe('null');
      expect(determineArrayType([[1], [2]], on)).toBe('[number]');
      expect(determineArrayType([() => {}], on)).toBe('function');
      expect(determineArrayType(['a', 'b'], on)).toBe('string');
      expect(determineArrayType([Symbol('s')], on)).toBe('symbol');
    });
  });
});


describe('determineArrayType: discoverTypes', () => {
  const coords = [1, 2];
  const point = { predicate: (value: unknown) => value === coords, discoveredType: 'Point' };
  const blank: unknown[] = [];
  const blankEntry = { predicate: (value: unknown) => value === blank, discoveredType: 'Blank' };
  const date = new Date();
  const stamp = { predicate: (value: unknown) => value instanceof Date, discoveredType: 'Stamp' };
  const set = new Set();
  const setAsNumbers = { predicate: (value: unknown) => value instanceof Set, discoveredType: '[number]' };

  it('predicates receive every classified cell, once', () => {
    const predicate = jest.fn(() => false);
    determineArrayType([1, 'a', null], { discoverTypes: [{ predicate, discoveredType: 'X' }] });
    expect(predicate.mock.calls).toEqual([[1], ['a'], [null]]);
  });

  it('the first matching entry wins and later predicates are not evaluated', () => {
    const first = jest.fn(() => false);
    const second = jest.fn(() => true);
    const third = jest.fn(() => true);
    const result = determineArrayType([1], {
      discoverTypes: [
        { predicate: first, discoveredType: 'One' },
        { predicate: second, discoveredType: 'Two' },
        { predicate: third, discoveredType: 'Three' },
      ],
    });
    expect(result).toBe('Two');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(third).not.toHaveBeenCalled();
  });

  it('final labels are compared, matched or not', () => {
    const decimal = { predicate: (value: unknown) => value instanceof Decimal, discoveredType: 'number' };
    expect(determineArrayType([new Decimal(1), 2], { discoverTypes: [decimal] })).toBe('number');
    expect(determineArrayType([new Decimal(1), 'a'], { discoverTypes: [decimal] })).toBe('mix');
  });

  it.each([
    ['[coords, [], coords]', [coords, [], coords], [point], 'Point'],
    ['[coords, [], [3]]', [coords, [], [3]], [point], 'mix'],
    ["[[1], ['a'], coords]", [[1], ['a'], coords], [point], 'mix'],
    ['[[1], blank]', [[1], blank], [blankEntry], 'mix'],
    ['[blank, blank]', [blank, blank], [blankEntry], 'Blank'],
    ['[blank, []]', [blank, []], [blankEntry], 'mix'],
    ['[[], [], date]', [[], [], date], [stamp], 'mix'],
    ['[set, []]', [set, []], [setAsNumbers], 'mix'],
    ['[set, [1], []]', [set, [1], []], [setAsNumbers], '[number]'],
    ['[coords, [undefined]]', [coords, [undefined]], [point], 'Point'],
    ['[set, [undefined]]', [set, [undefined]], [setAsNumbers], 'mix'],
  ])('%s', (_name, input, discoverTypes, expected) => {
    expect(determineArrayType(input, { discoverTypes })).toBe(expected);
  });

  it('a labelled value is never a wildcard', () => {
    expect(determineArrayType(['a', []], { discoverTypes: [{ predicate: (value) => value === 'a', discoveredType: 'Letter' }] })).toBe('mix');
    expect(determineArrayType([1, undefined], { discoverTypes: [{ predicate: (value) => value === undefined, discoveredType: 'Missing' }] })).toBe('mix');
  });

  it('whole-array shortcuts do not bypass discovery', () => {
    expect(determineArrayType([[1], date], { discoverTypes: [stamp] })).toBe('mix');
    const special = { a: 1 };
    expect(determineArrayType([{ a: 2 }, special], { discoverTypes: [{ predicate: (value) => value === special, discoveredType: 'Special' }] })).toBe('mix');
  });

  it('no match, or no entries, keeps the existing classification', () => {
    const never = { predicate: () => false, discoveredType: 'Never' };
    expect(determineArrayType([{ a: 1 }, { b: 2 }], { discoverTypes: [never] })).toBe('mixed object');
    expect(determineArrayType([[1], [], [2]], { discoverTypes: [never] })).toBe('[number]');
    expect(determineArrayType([new A(), new A()], { discoverTypes: [] })).toBe('A');
  });

  it('discovery applies at every depth that is classified', () => {
    expect(determineArrayType([[date], [date]], { discoverTypes: [stamp] })).toBe('[Stamp]');
    expect(determineArrayType([{ when: new Date() }], { discoverTypes: [{ predicate: (value) => value instanceof Date, discoveredType: 'Timestamp' }] }))
      .toBe('{ when: Timestamp }');
    expect(determineArrayType([{ list: [date] }], { discoverTypes: [stamp] })).toBe('{ list: [Stamp] }');
  });

  it('values that are not visited are not passed to predicates', () => {
    const predicate = jest.fn(() => false);
    determineArrayType([{ when: new Date() }], { verboseObjects: 'none', discoverTypes: [{ predicate, discoveredType: 'X' }] });
    expect(predicate).toHaveBeenCalledTimes(1);
  });

  it('predicate and getter errors propagate unchanged', () => {
    const boom = new Error('boom');
    const throwing = () => determineArrayType([1], {
      discoverTypes: [{
        predicate() {
          throw boom;
        },
        discoveredType: 'X',
      }],
    });
    expect(throwing).toThrow(boom);

    const getterError = new Error('getter');
    const withGetter = {
      get value() {
        throw getterError;
      },
    };
    expect(() => determineArrayType([withGetter])).toThrow(getterError);
  });
});


describe('determineArrayType: precedence', () => {

  it('discoverTypes, then identifyClasses, then automatic classification', () => {
    const isSub = { predicate: (value: unknown) => value instanceof Sub, discoveredType: 'S' };
    expect(determineArrayType([new Sub()], { identifyClasses: [Base], discoverTypes: [isSub] })).toBe('S');
    expect(determineArrayType([new Sub()], { identifyClasses: [Base] })).toBe('Base');
    expect(determineArrayType([new Sub()])).toBe('Sub');
  });

  it('explicit options still apply under ignoreCustomClassNames', () => {
    expect(determineArrayType([new Sub()], { ...on, identifyClasses: [Base] })).toBe('Base');
    expect(determineArrayType([new A(), {}], { ...on, identifyClasses: [A] })).toBe('mix');
    expect(determineArrayType([new MyDate()], { ...on, identifyClasses: [MyDate] })).toBe('MyDate');
    expect(determineArrayType([new Date()], { ...on, discoverTypes: [{ predicate: (value) => value instanceof Date, discoveredType: 'Stamp' }] })).toBe('Stamp');
  });

  it('errors from Proxy traps propagate under ignoreCustomClassNames', () => {
    const trapError = new Error('trap');
    const proxy = new Proxy({}, {
      getPrototypeOf() {
        throw trapError;
      },
    });
    expect(() => determineArrayType([proxy], on)).toThrow(trapError);
  });

  it('a revoked Proxy throws in both modes', () => {
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();
    expect(() => determineArrayType([proxy])).toThrow(TypeError);
    expect(() => determineArrayType([proxy], on)).toThrow(TypeError);
  });
});


describe('determineArrayType: cycles', () => {

  const modes: [string, Parameters<typeof determineArrayType>[1]][] = [
    ['default', {}],
    ['ignoreCustomClassNames', on],
    ['nullIsEmpty', nullIsEmpty],
    ['discoverTypes (no match)', { discoverTypes: [{ predicate: () => false, discoveredType: 'Never' }] }],
  ];

  describe.each(modes)('in %s mode', (_mode, options) => {
    it('a self-referencing array', () => {
      const array: unknown[] = [];
      array.push(array);
      expect(determineArrayType(array, options)).toBe('<circular>');
    });

    it('an indirect array/object cycle', () => {
      const array: unknown[] = [];
      const holder = { arr: array };
      array.push(holder);
      // Under ignoreCustomClassNames the holder is collapsed to 'object' and never traversed
      const collapsed = options?.ignoreCustomClassNames === true;
      expect(determineArrayType(array, options)).toBe(collapsed ? 'object' : '{ arr: <circular> }');
      expect(determineArrayType([holder], options)).toBe(collapsed ? 'object' : '{ arr: [<circular>] }');
    });

    it('a marker can be folded into a mix', () => {
      const array: unknown[] = [];
      array.push(array, [1]);
      expect(determineArrayType(array, options)).toBe('[mix]');
    });

    it('shared references in separate branches are not cycles', () => {
      const row = [1];
      expect(determineArrayType([row, row], options)).toBe('[number]');
      expect(determineArrayType([[row], [row]], options)).toBe('[[number]]');
    });
  });

  it('a self-referencing expanded object', () => {
    const node: Record<string, unknown> = { n: 1 };
    node.self = node;
    expect(determineArrayType([node], { verboseObjects: 'all' })).toBe('{ n: number, self: <circular> }');
    expect(determineArrayType([node])).toBe('{ n: number, self: object }');
    expect(determineArrayType([node, 1], { verboseObjects: 'all' })).toBe('mix');
  });

  it('a shared object without a cycle', () => {
    const shared = { v: 1 };
    expect(determineArrayType([{ a: shared, b: shared }], { verboseObjects: 'all' })).toBe('{ a: { v: number }, b: { v: number } }');
  });

  it('discovery stops traversal before a cycle is reached', () => {
    const child: Record<string, unknown> = {};
    const root = { child };
    child.root = root;
    expect(determineArrayType([root], { verboseObjects: 'all' })).toBe('{ child: { root: <circular> } }');

    const isChild = jest.fn((value: unknown) => value === child);
    expect(determineArrayType([root], { verboseObjects: 'all', discoverTypes: [{ predicate: isChild, discoveredType: 'Child' }] })).toBe('{ child: Child }');
    expect(isChild).toHaveBeenCalledTimes(2);

    const node: Record<string, unknown> = { n: 1 };
    node.self = node;
    const isNode = jest.fn((value: unknown) => value === node);
    expect(determineArrayType([node], { verboseObjects: 'all', discoverTypes: [{ predicate: isNode, discoveredType: 'Node' }] })).toBe('Node');
    expect(isNode).toHaveBeenCalledTimes(1);
  });

  it('opaque objects are not traversed', () => {
    class SelfReferencing {
      self = this;
    }
    expect(determineArrayType([new SelfReferencing()], on)).toBe('object');
  });
});


describe('determineArrayType: wildcards and nullIsEmpty', () => {

  it('undefined cells are wildcards', () => {
    expect(determineArrayType([1, undefined, 2])).toBe('number');
    expect(determineArrayType([undefined, 1])).toBe('number');
    expect(determineArrayType([undefined, undefined])).toBe('undefined');
  });

  it('holes in sparse arrays are wildcards', () => {
    const sparse: number[] = [1];
    sparse[2] = 2;
    expect(determineArrayType(sparse)).toBe('number');
  });

  it('null is a value unless nullIsEmpty is set', () => {
    expect(determineArrayType([1, null])).toBe('mix');
    expect(determineArrayType([1, null], nullIsEmpty)).toBe('number');
    expect(determineArrayType([null, null, 1])).toBe('mix');
    expect(determineArrayType([null, null, 1], nullIsEmpty)).toBe('number');
  });

  it('levels made only of absent cells', () => {
    expect(determineArrayType([null, null])).toBe('null');
    expect(determineArrayType([null, null], nullIsEmpty)).toBe('null');
    expect(determineArrayType([null, undefined])).toBe('null');
    expect(determineArrayType([null, undefined], nullIsEmpty)).toBe('empty');
    expect(determineArrayType([[null, undefined]], nullIsEmpty)).toBe('[empty]');
  });

  it('wildcards among objects', () => {
    expect(determineArrayType([{ a: 1 }, undefined])).toBe('{ a: number }');
    expect(determineArrayType([{ a: 1 }, { b: 2 }, undefined])).toBe('mixed object');
    expect(determineArrayType([{ a: 1 }, null])).toBe('mix');
    expect(determineArrayType([{ a: 1 }, null], nullIsEmpty)).toBe('{ a: number }');
    expect(determineArrayType([{ a: undefined }])).toBe('{ a: undefined }');
  });

  it('empty arrays are arrays', () => {
    expect(determineArrayType([[1], undefined, []])).toBe('[number]');
    expect(determineArrayType([[1, undefined], [2]])).toBe('[number]');
    expect(determineArrayType([[], undefined])).toBe('[empty]');
    expect(determineArrayType([[], [], undefined])).toBe('[empty]');
    expect(determineArrayType([1, []])).toBe('mix');
  });

  it('wildcard arrays give way to real arrays', () => {
    expect(determineArrayType([[1], [undefined]])).toBe('[number]');
    expect(determineArrayType([[1], [undefined, undefined]])).toBe('[number]');
    expect(determineArrayType([[1], [], [undefined]])).toBe('[number]');
    expect(determineArrayType([[1], [null]])).toBe('[mix]');
    expect(determineArrayType([[1], [null]], nullIsEmpty)).toBe('[number]');
    expect(determineArrayType([[1], [null, null]], nullIsEmpty)).toBe('[number]');
    expect(determineArrayType([[1], [null, undefined]], nullIsEmpty)).toBe('[number]');
    expect(determineArrayType([[undefined], 1])).toBe('mix');
  });

  it('levels made only of wildcard arrays', () => {
    expect(determineArrayType([[undefined], [undefined]])).toBe('[undefined]');
    expect(determineArrayType([[null], [null]])).toBe('[null]');
    expect(determineArrayType([[null], [null]], nullIsEmpty)).toBe('[null]');
    expect(determineArrayType([[], [undefined]])).toBe('[empty]');
    expect(determineArrayType([[undefined], [null]], nullIsEmpty)).toBe('[empty]');
    expect(determineArrayType([[undefined], [null], []], nullIsEmpty)).toBe('[empty]');
    expect(determineArrayType([[[undefined], [null], []]], nullIsEmpty)).toBe('[[empty]]');
  });

  it('without nullIsEmpty, [null] is an ordinary array type', () => {
    expect(determineArrayType([[undefined], [null]])).toBe('[null]');
    expect(determineArrayType([[undefined], [null], []])).toBe('[null]');
    expect(determineArrayType([[undefined], [1], []])).toBe('[number]');
  });

  it('wildcard arrays at any depth', () => {
    expect(determineArrayType([[[undefined]], [[1]]])).toBe('[[number]]');
    expect(determineArrayType([[[]], [[1]]])).toBe('[[number]]');
    expect(determineArrayType([[[null]], [[1]]])).toBe('[mix]');
    expect(determineArrayType([[[null]], [[1]]], nullIsEmpty)).toBe('[[number]]');
  });

  it('arrays mixed with non-arrays are a mix', () => {
    expect(determineArrayType([[1], 'a'])).toBe('mix');
    expect(determineArrayType([[1], [], 'a'])).toBe('mix');
  });
});


describe('determineArrayType: default behavior is preserved', () => {

  const defaults = [
    ['options omitted', undefined],
    ['options explicitly false', { ignoreCustomClassNames: false, nullIsEmpty: false }],
  ] as const;

  describe.each(defaults)('%s', (_name, options) => {

    it('empty-array leniency among arrays', () => {
      expect(determineArrayType([[1, 2], [], [3]], options)).toBe('[number]');
      expect(determineArrayType([[], ['a'], []], options)).toBe('[string]');
      expect(determineArrayType([[1], [], ['a']], options)).toBe('[mix]');
      expect(determineArrayType([[], []], options)).toBe('[empty]');
      expect(determineArrayType([[1, 2], ['a', 'b']], options)).toBe('[mix]');
    });

    it('class names and object shapes', () => {
      expect(determineArrayType([new A(), new A()], options)).toBe('A');
      expect(determineArrayType([new A(), new B()], options)).toBe('mix');
      expect(determineArrayType([{ a: 1 }, { b: 2 }], options)).toBe('mixed object');
      expect(determineArrayType([new MyDate()], options)).toBe('MyDate');
      expect(determineArrayType([new FakeDate()], options)).toBe('Date');
      expect(determineArrayType([Buffer.from('a')], options)).toBe('Buffer');
    });

    it('verboseObjects and identifyClasses', () => {
      const object = { name: 'test', nested: { prop: true } };
      expect(determineArrayType([object, object], options)).toBe('{ name: string, nested: object }');
      expect(determineArrayType([object, object], { ...options, verboseObjects: 'all' })).toBe('{ name: string, nested: { prop: boolean } }');
      expect(determineArrayType([new Sub()], { ...options, identifyClasses: [Base] })).toBe('Base');
    });

    it('the plain-object check describes only the first object', () => {
      expect(determineArrayType([{ a: 1 }, { a: 'x' }], options)).toBe('{ a: number }');
    });
  });
});
