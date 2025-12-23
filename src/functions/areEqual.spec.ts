/* eslint-disable unicorn/no-useless-undefined,
                  unicorn/consistent-function-scoping,
                  @typescript-eslint/no-explicit-any
*/

import areEqual from './areEqual';


/**
 * areEqual TESTS
 *
 * @group unit/areEqual
 */


describe('areEqual', () => {

  it('compares any two primitives', () => {
    expect(areEqual(1, 1)).toBe(true);
    expect(areEqual(1, 5)).toBe(false);

    expect(areEqual('one', 'one')).toBe(true);
    expect(areEqual('one', 'two')).toBe(false);

    expect(areEqual(true, true)).toBe(true);
    expect(areEqual(true, false)).toBe(false);
  });

  it('compares null values', () => {
    expect(areEqual(null, null)).toBe(true);
  });

  it('compares undefined values', () => {
    expect(areEqual(undefined, undefined)).toBe(true);
  });

  it('distinguish between null and undefined', () => {
    expect(areEqual(null, undefined)).toBe(false);
  });

  it('compares dates', () => {
    expect(areEqual(new Date('1/1/2000'), new Date('1/1/2000'))).toBe(true);
    expect(areEqual(new Date('1/1/2000'), new Date('1/2/2000'))).toBe(false);
  });

  it('compare an array to itself', () => {
    const arr = [1, 2, 3, 4];

    expect(areEqual(arr, arr)).toBe(true);
  });

  it('compares two simple identical array', () => {
    const arr1 = [1, 2, 3, 4];
    const arr2 = [1, 2, 3, 4];

    expect(areEqual(arr1, arr2)).toBe(true);
  });

  it('compares two empty arrays', () => {
    expect(areEqual([], [])).toBe(true);
  });

  it('notices when two arrays are not equal', () => {
    const arr1 = [1, 2, 3, 4];
    const arr2 = [1, 2, 3, 5];

    expect(areEqual(arr1, arr2)).toBe(false);
  });

  it('compares two empty objects', () => {
    expect(areEqual({}, {})).toBe(true);
  });

  it('compares two simple identical objects', () => {
    const obj1 = { prop1: 'Hi', prop2: 'there!' };
    const obj2 = { prop1: 'Hi', prop2: 'there!' };

    expect(areEqual(obj1, obj2)).toBe(true);
  });

  it('notice when two objects are different based on property naming', () => {
    const obj1 = { prop1: 'Hi', prop2: 'there!' };
    const obj2 = { prop1: 'Hi', prop3: 'there!' };

    expect(areEqual(obj1, obj2)).toBe(false);
  });

  it('makes comparison only based on provided properties', () => {
    const obj1 = { prop1: 'Hi', prop2: 'there!', prop3: 'Bill' };
    const obj2 = { prop1: 'Hi', prop2: 'there!', prop3: 'Bob' };

    expect(areEqual(obj1, obj2, { comparisonProps: ['prop1', 'prop2'] })).toBe(true);
  });

  it('always returns true if both object do not have any of the specified comparison props', () => {
    const obj1 = { prop1: 'prop1', prop2: 'props2' };
    const obj2 = { props3: 'prop3', prop4: 'prop4' };

    expect(areEqual(obj1, obj2, { comparisonProps: ['prop5', 'prop6'] })).toBe(true);
  });

  it('treats empty comparisonProps as no comparisonProps', () => {
    const obj1 = { prop1: 'Hi', prop2: 'there!', prop3: 'Bill' };
    const obj2 = { prop1: 'Hi', prop2: 'there!', prop3: 'Bob' };
    const obj3 = { prop1: 'Hi', prop2: 'there!', prop3: 'Bill' };

    expect(areEqual(obj1, obj2, { comparisonProps: [] })).toBe(false);
    expect(areEqual(obj1, obj3, { comparisonProps: [] })).toBe(true);
  });

  it('Uses provided checkCases to compare items', () => {
    const checkCase = (item1: unknown, item2: unknown) => item1?.toString() === item2?.toString();

    class Obj {
      constructor(public prop1: string, public prop2: string) {}

      toString() {
        return `${this.prop1} ${this.prop2}`;
      }
    }

    const obj1 = new Obj('Hi', 'there!');

    expect(areEqual(obj1, 'Hi there!', { checkCases: [checkCase] })).toBe(true);
  });

  it('returns true if any of the checkCases returns true', () => {

    class Obj {
      constructor(public prop1: string, public prop2: string) {}

      toString() {
        return `${this.prop1} ${this.prop2}`;
      }
    }

    const checkCase1 = (item1: any, item2: any) => item1.prop1 === item2.prop1;
    const checkCase2 = (item1: any, item2: any) => item1.toString() === item2.toString();

    const obj1 = new Obj('Hi', 'there!');

    expect(areEqual(obj1, 'Hi there!', { checkCases: [checkCase1, checkCase2] })).toBe(true);
  });

  it('makes a comparison between a string and a Date', () => {
    const strDate = '1/2/2000';
    const date = new Date('1/2/2000');

    expect(areEqual(strDate, date)).toBe(false);
    expect(areEqual(strDate, date, { stringDate: true })).toBe(true);
  });

  it('make a string-date comparison when both are properties of an object', () => {
    const obj1 = { prop1: '1/2/2000', prop2: 'Hi' };
    const obj2 = { prop1: new Date('1/2/2000'), prop2: 'Hi' };

    expect(areEqual(obj1, obj2)).toBe(false);
    expect(areEqual(obj1, obj2, { stringDate: true })).toBe(true);
  });

  it('ignores circular referencing', () => {
    class Obj {
      prop1 = 'Hi';

      prop2?: Obj;
    }

    const obj1 = new Obj();
    obj1.prop2 = obj1;

    const obj2 = new Obj();
    obj2.prop2 = obj1;

    const obj3 = new Obj();
    obj3.prop2 = obj3;

    expect(areEqual(obj1, obj2)).toBe(true);
    expect(areEqual(obj1, obj3)).toBe(true);
  });

  it('ignores order of arrays when option is set and the array contains simple objects', () => {
    const arr1 = [0, 1, 2, 3, 4];
    const arr2 = [4, 3, 2, 1, 0];

    expect(areEqual(arr1, arr2)).toBe(false);
    expect(areEqual(arr1, arr2, { ignoreArrayOrder: true })).toBe(true);
  });

  it('ignores order of internal arrays in objects when option is set', () => {
    const obj1 = { arr: [0, 1, 2, 3, 4] };
    const obj2 = { arr: [4, 3, 2, 1, 0] };

    expect(areEqual(obj1, obj2)).toBe(false);
    expect(areEqual(obj1, obj2, { ignoreArrayOrder: true })).toBe(true);
  });

  it('ignores order of all arrays in object graph when option is set', () => {
    const arr1 = [
      { index: 0, arr: [0, 1, 2, 3, 4] },
      { index: 1, arr: [5, 6, 7, 8, 9] }
    ];

    const arr2 = [
      { index: 1, arr: [9, 8, 7, 6, 5] },
      { index: 0, arr: [4, 3, 2, 1, 0] }
    ];

    expect(areEqual(arr1, arr2)).toBe(false);
    expect(areEqual(arr1, arr2, { ignoreArrayOrder: true })).toBe(true);
  });

  it('check equality of maps', () => {
    const map1 = new Map([['a', 1], ['b', 2]]);
    const map2 = new Map([['b', 2], ['a', 1]]);

    expect(areEqual(map1, map2)).toBe(true);
  });

  it('checks equality of sets', () => {
    const set1 = new Set([1, 2, 3]);
    const set2 = new Set([3, 2, 1]);

    expect(areEqual(set1, set2)).toBe(true);
  });

  it('handles nested arrays,Maps and Sets', () => {
    type NestedMapType = Map<string, Set<number> | number[]>;

    const map1: NestedMapType = new Map();
    map1.set('a', new Set([1, 2, 3]));
    map1.set('b', [1, 2, 3]);

    const map2: NestedMapType = new Map();
    map2.set('b', [3, 2, 1]);
    map2.set('a', new Set([3, 2, 1]));

    expect(areEqual(map1, map2)).toBe(true);
  });

  it('handles arrays with mixed types', () => {
    const arr1 = [1, 'two', { three: 3 }, [4, 5]];
    const arr2 = [1, 'two', { three: 3 }, [4, 5]];
    const arr3 = [1, 'two', { three: 4 }, [4, 5]];

    expect(areEqual(arr1, arr2)).toBe(true);
    expect(areEqual(arr1, arr3)).toBe(false);
    expect(areEqual(arr1, arr2, { ignoreArrayOrder: true })).toBe(true);
  });

  it('handles null and undefined in arrays', () => {
    const arr1 = [1, null, undefined, 4];
    const arr2 = [4, undefined, null, 1];

    expect(areEqual(arr1, arr2)).toBe(false);
    expect(areEqual(arr1, arr2, { ignoreArrayOrder: true })).toBe(true);
  });

  it('compares objects with symbol properties', () => {
    const symbol1 = Symbol('test');
    const symbol2 = Symbol('test');
    const obj1 = { [symbol1]: 'value' };
    const obj2 = { [symbol2]: 'value' };
    const obj3 = { [symbol1]: 'different' };

    expect(areEqual(obj1, obj2)).toBe(false); // Different symbols
    expect(areEqual(obj1, obj3)).toBe(false);
  });

  it('handles deeply nested structures with ignoreArrayOrder', () => {
    const obj1 = {
      a: [1, 2, 3],
      b: {
        c: [4, 5, 6],
        d: [{ x: [7, 8] }, { y: [9, 10] }]
      }
    };
    const obj2 = {
      a: [3, 2, 1],
      b: {
        c: [6, 5, 4],
        d: [{ y: [10, 9] }, { x: [8, 7] }]
      }
    };

    expect(areEqual(obj1, obj2)).toBe(false);
    expect(areEqual(obj1, obj2, { ignoreArrayOrder: true })).toBe(true);
  });

  it('handles comparisons between objects or arrays that have both string dates, matching Date objects and regular strings', () => {
    const arr1 = ['2000-01-01', new Date('2000-01-02'), 'Foo'];
    const arr2 = [new Date('2000-01-01'), '2000-01-02', 'Foo'];

    expect(areEqual(arr1, arr2)).toBe(false);
    expect(areEqual(arr1, arr2, { stringDate: true })).toBe(true);
  });

  it('handles empty or invalid dates', () => {
    const invalidDate1 = new Date('invalid1');
    const invalidDate2 = new Date('invalid2');

    expect(areEqual(invalidDate1, invalidDate2)).toBe(false);
    expect(areEqual(invalidDate1, invalidDate2, { invalidDatesAreEqual: true })).toBe(true);
  });

  it('compares two primitives well when the comparisonProps are set', () => {
    expect(areEqual('string', 'string', { comparisonProps: ['prop1', 'prop2'] })).toBe(true);
    expect(areEqual('string1', 'string2', { comparisonProps: ['prop1', 'prop2'] })).toBe(false);
  });

  it('safe against circular reference when the comparisonProps are set', () => {
    class Obj {
      prop1 = 'Hi';

      prop2?: Obj;
    }

    const obj1 = new Obj();
    obj1.prop2 = obj1;

    const obj2 = new Obj();
    obj2.prop2 = obj1;

    const obj3 = new Obj();
    obj3.prop2 = obj3;

    expect(areEqual(obj1, obj2, { comparisonProps: ['prop1', 'prop2'] })).toBe(true);
    expect(areEqual(obj1, obj3, { comparisonProps: ['prop1', 'prop2'] })).toBe(true);
  });
});
