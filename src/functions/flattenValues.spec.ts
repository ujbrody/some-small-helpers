import flattenValues from './flattenValues';

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

    expect(flattenValues(a)).toHaveLength(expected.length);
    expect(flattenValues(a)).toEqual(expect.arrayContaining(expected));
  });

  it('returns end values when they are empty objects or arrays', () => {
    const a = {
      blah: {},
      blim: 8
    };

    expect(flattenValues(a)).toHaveLength(2);
    expect(flattenValues(a)).toEqual(expect.arrayContaining([{}, 8]));
  });
});
