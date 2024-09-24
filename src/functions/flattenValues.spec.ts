import flattenValues from './flattenValues';


/**
 * flattenValues TESTS
 *
 * @group unit/flattedValues
 */


describe('getEndValues', () => {

  it('returns the value as a single array cell when given a string', () => {
    expect(flattenValues('hello')).toEqual(['hello']);
  });

  it('returns the value as a single array cell when given a different primitive', () => {
    expect(flattenValues(14)).toEqual([14]);
  });

  it('returns any value that is not values-containing object in a single array cell', () => {
    const sym = Symbol();

    expect(flattenValues(sym)).toEqual([sym]);
  });

  it('returns all values of an object', () => {
    const a = { blah: 'one', foo: 'two', bar: 'three' };

    const result = flattenValues(a);

    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining(['one', 'two', 'three']));
  });

  it('returns all primitives in an array', () => {
    const a = ['one', 'two', 'three'];

    expect(flattenValues(a)).toEqual(a);
  });

  it('returns primitives in flat array from a nested array', () => {
    const a = [1, [2, [3, [4]], 5]];

    expect(flattenValues(a)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns end values from object that also contains array', () => {
    const a = {
      arr: [1, { two: 2 }],
      blah: {
        foo: {
          bar: [{ boom: 'blast' }, 'yey'],
          tick: false
        }
      },
      tock: 42
    };

    const expected = [1, 2, 'blast', 'yey', false, 42];

    const result = flattenValues(a);

    expect(result).toHaveLength(expected.length);
    expect(result).toEqual(expect.arrayContaining(expected));
  });

  it('returns empty array for empty objects', () => {
    expect(flattenValues({})).toEqual([]);
  });

  it('returns only non-empty values across the entire input graph', () => {
    const a = {
      blah: {},
      blim: 8
    };

    expect(flattenValues(a)).toHaveLength(1);
    expect(flattenValues(a)).toEqual(expect.arrayContaining([8]));
  });

  it('returns empty array for empty arrays', () => {
    expect(flattenValues([])).toEqual([]);
  });

  it('returns values of a Map', () => {
    const map = new Map([['a', 1], ['b', 2]]);

    expect(flattenValues(map).sort()).toEqual([1, 2]);
  });

  it('returns values of a Set', () => {
    const set = new Set([1, 2, 3]);

    expect(flattenValues(set).sort()).toEqual([1, 2, 3]);
  });

  it('returns values of a typed array', () => {
    const typedArray = new Uint8Array([1, 2, 3]);

    expect(flattenValues(typedArray).sort()).toEqual([1, 2, 3]);
  });

  it('returns values of a Generator object', () => {
    function* gen() { // eslint-disable-line unicorn/consistent-function-scoping
      yield 1;
      yield 2;
      yield 3;
    }
    const g = gen();

    expect(flattenValues(g).sort()).toEqual([1, 2, 3]);
  });

  it('returns values of a custom iterator implementation', () => {
    const customIterable = {
      *[Symbol.iterator]() {
        yield 1;
        yield 2;
        yield 3;
      }
    };

    expect(flattenValues(customIterable).sort()).toEqual([1, 2, 3]);
  });

  it('returns all end values across complex graphs that include multiple types', () => {
    function* gen() { // eslint-disable-line unicorn/consistent-function-scoping
      yield 'one';
      yield { prop2: 'prop-in-gen' };
    }
    const map = new Map();
    map.set('prop2', 'prop-in-map');
    map.set('four', 4);

    const input = {
      arr: ['two', { prop1: 'prop-in-arr' }, false],
      set: new Set([1, 'three']),
      gen: gen(),
      map
    };

    expect(flattenValues(input).sort()).toEqual(['two', 'prop-in-arr', false, 1, 'three', 'one', 'prop-in-gen', 'prop-in-map', 4].sort());
  });

  it('returns duplicated values by default if exist', () => {
    const obj = {
      prop1: 'one',
      prop2: 2,
      prop1again: 'one'
    };

    expect(flattenValues(obj).sort()).toEqual(['one', 2, 'one'].sort());
  });

  it('returns unique values (eliminating duplications) if option is set', () => {
    const obj = {
      prop1: 'one',
      prop2: 2,
      prop1again: 'one'
    };

    expect(flattenValues(obj, { returnUnique: true }).sort()).toEqual(['one', 2].sort());
  });
});
