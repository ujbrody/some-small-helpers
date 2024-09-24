import isEmpty from './isEmpty';


/**
 * isEmpty TESTS
 *
 * @group unit/isEmpty
 */

describe('isEmpty', () => {

  it('identifies `null` as empty', () => {
    expect(isEmpty(null)).toBe(true);
  });

  it('identifies `undefined` as empty', () => {
    expect(isEmpty(undefined)).toBe(true); // eslint-disable-line unicorn/no-useless-undefined
  });

  it('identifies NaN as empty', () => {
    expect(isEmpty(0 / 0)).toBe(true);
  });

  it('identifies empty string as empty', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('identifies non-empty string as not empty', () => {
    expect(isEmpty('string')).toBe(false);
  });

  it('identifies a string of whitespace as empty', () => {
    expect(isEmpty('    ')).toBe(true);
  });

  it('identifies a string of whitespace as not empty if setting was changed in options', () => {
    expect(isEmpty('    ', { whitespaceIsEmpty: false })).toBe(false);
  });

  it('identifies empty string as no empty if setting was added in the options', () => {
    expect(isEmpty('', { emptyStringIsEmpty: false })).toBe(false);
  });

  it('identifies any number as not empty', () => {
    expect(isEmpty(10)).toBe(false);
    expect(isEmpty(0)).toBe(false);
  });

  it('identifies 0 as empty if the setting was added in the options', () => {
    expect(isEmpty(0, { zeroIsEmpty: true })).toBe(true);
  });

  it('adding a single new option does not override all other options', () => {
    expect(isEmpty('', { zeroIsEmpty: false })).toBe(true);
  });

  it('identify any boolean value as not empty', () => {
    expect(isEmpty(true)).toBe(false);
    expect(isEmpty(false)).toBe(false);
  });

  it('identifies `false` as empty if the setting was added in the options', () => {
    expect(isEmpty(false, { falseIsEmpty: true })).toBe(true);
  });

  it('identifies an empty array as empty', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('identifies array with empty cells as empty', () => {
    const arr = [null, undefined, ''];
    expect(isEmpty(arr)).toBe(true);
  });

  it('return false for a single value not empty in array', () => {
    const arr = [null, undefined, '', 4];
    expect(isEmpty(arr)).toBe(false);
  });

  it('identifies array as empty if in contains empty arrays', () => {
    const arr = [null, '', [null, undefined], ['']];
    expect(isEmpty(arr)).toBe(true);
  });

  it('identifies cell out of range in array as empty', () => {
    const arr = [0, 1, 2, 3];
    expect(isEmpty(arr[4])).toBe(true);
  });

  it('identifies illegal cell index as empty', () => {
    const arr = [0, 1, 2, 3];
    expect(isEmpty(arr[-1])).toBe(true);
  });

  it('identifies an empty Set as empty', () => {
    expect(isEmpty(new Set())).toBe(true);
  });

  it('identifies Set with empty cells as empty', () => {
    const set = new Set([null, undefined, '']);
    expect(isEmpty(set)).toBe(true);
  });

  it('return false for a single value not empty in Set', () => {
    const set = new Set([null, undefined, '', 4]);
    expect(isEmpty(set)).toBe(false);
  });

  it('identifies Set as empty if in contains empty Sets', () => {
    const set = new Set([null, '', new Set([null, undefined]), new Set([''])]);
    expect(isEmpty(set)).toBe(true);
  });

  it('identifies empty objects as empty', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('identifies an empty Map as empty', () => {
    expect(isEmpty(new Map())).toBe(true);
  });

  it('identifies non-empty object as not empty', () => {
    expect(isEmpty({ prop: 'blah' })).toBe(false);
  });

  it('identifies an instance of Date as not empty', () => {
    expect(isEmpty(new Date())).toBe(false);
  });

  it('identifies a RegEx instance as not empty', () => {
    expect(isEmpty(/regex/)).toBe(false);
  });

  it('identifies an Error object as not empty', () => {
    expect(isEmpty(new Error())).toBe(false); // eslint-disable-line unicorn/error-message
  });

  it('identifies a symbol as not empty', () => {
    expect(isEmpty(Symbol('blah'))).toBe(false);
  });

  it('identifies a function as not empty', () => {
    expect(isEmpty(function blah() {})).toBe(false); // eslint-disable-line prefer-arrow-callback
  });

  it('identifies object with only empty members as empty', () => {
    const obj = {
      prop1: null,
      prop2: { prop3: undefined, prop4: '' }
    };
    expect(isEmpty(obj)).toBe(true);
  });

  it('identifies Map with only empty values as empty (keys can have values, like object)', () => {
    const map = new Map();
    const subMap = new Map();
    map.set('prop1', '');
    map.set('prop2', null);
    subMap.set('prop3', undefined);
    subMap.set('prop4', '');
    map.set('prop3', subMap);

    expect(isEmpty(map)).toBe(true);
  });

  it('mark Map as empty only if both keys and values are empty when option is set', () => {
    const map = new Map();
    const subMap = new Map();
    map.set('prop1', '');
    map.set('prop2', null);
    subMap.set('prop3', undefined);
    subMap.set('prop4', '');
    map.set('prop3', subMap);

    expect(isEmpty(map, { treatMapsAsObjects: false })).toBe(false);
  });

  it('identify any object with non-standard `toString` method as not empty', () => {

    class EmptyObj {
      // eslint-disable-next-line class-methods-use-this
      toString() {
        return 'Something Else';
      }
    }
    const emptyObj = new EmptyObj();
    const symbol = Symbol('foo');

    expect(isEmpty(emptyObj)).toBe(false);
    expect(isEmpty(symbol)).toBe(false);
  });

  it('identifies array with empty objects as empty', () => {
    const veryBidEmpty = [
      {
        prop1: null,
        prop2: [
          { prop3: null, prop4: null }
        ],
        prop5: { prop6: null, prop7: ['', { prop8: '' }] }
      }
    ];

    expect(isEmpty(veryBidEmpty)).toBe(true);
  });

  it('safe against circular referencing with non-empty objects', () => {
    class CircularReferenceFull {

      public self?: CircularReferenceFull;

      public a?: string;

      public b?: number;
    }

    const obj = new CircularReferenceFull();
    obj.self = obj;
    obj.a = 'blah';
    obj.b = 1;

    expect(isEmpty(obj)).toBe(false);
  });

  it('safe against circular referencing with non-empty array', () => {
    const arr: any[] = ['blah', 3]; // eslint-disable-line @typescript-eslint/no-explicit-any
    arr.unshift(arr);

    expect(isEmpty(arr)).toBe(false);
  });

  it('safe against circular referencing with empty objects', () => {
    class CircularReferenceEmpty {

      public self?: CircularReferenceEmpty;

      public a?: string;

      public b?: number;
    }

    const obj = new CircularReferenceEmpty();
    obj.self = obj;

    expect(isEmpty(obj)).toBe(true);
  });

  it('safe against circular referencing with empty arrays', () => {
    const arr: any[] = [null, undefined, '']; // eslint-disable-line @typescript-eslint/no-explicit-any
    arr.push(arr);

    expect(isEmpty(arr)).toBe(true);
  });

  it('safe against circular referencing when the only field is the referencing', () => {
    class CircularReferenceEmpty {

      public self?: CircularReferenceEmpty;
    }

    const obj = new CircularReferenceEmpty();
    obj.self = obj;

    expect(isEmpty(obj)).toBe(true);
  });

  it('safe against circular referencing when the only cell in array is the reference', () => {
    const arr: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    arr.push(arr);

    expect(isEmpty(arr)).toBe(true);
  });
});
