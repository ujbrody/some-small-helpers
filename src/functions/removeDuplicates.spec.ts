import removeDuplicates from './removeDuplicates';


/**
 * removeDuplicates TESTS
 *
 * @group unit/removeDuplicates
 */


function sameForMixedTypes(a: number | string, b: number | string) {
  return a === b;
}

describe('removeDuplicates', () => {

  it('returns the input untouched if it is not of type array', () => {
    expect(removeDuplicates('blah' as any)).toBe('blah'); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  it('returns empty array when input is empty', () => {
    expect(removeDuplicates([])).toEqual([]);
  });

  it('returns same single element when array has one item', () => {
    expect(removeDuplicates([42])).toEqual([42]);
    expect(removeDuplicates([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  it('returns one item when all elements are duplicates', () => {
    expect(removeDuplicates([7, 7, 7, 7])).toEqual([7]);
    const obj = { x: 1 };
    expect(removeDuplicates([obj, obj, obj])).toEqual([obj]);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 1, 3];
    const copy = [...arr];
    removeDuplicates(arr);
    expect(arr).toEqual(copy);
  });

  it('removes duplicates for simple array of primitives', () => {
    expect(removeDuplicates([1, 1, 2, 2, 3, 3, 4, 4])).toEqual([1, 2, 3, 4]);
  });

  it('removes duplicates when the items are objects', () => {
    const arr = [
      { firstName: 'Bill', lastName: 'Stepka' },
      { firstName: 'Mariko', lastName: 'Kawaguchi' },
      { firstName: 'Bill', lastName: 'Stepka' },
      { firstName: 'Bill', lastName: 'Stepka' },
      { firstName: 'Bob', lastName: 'Scott' },
      { firstName: 'Mariko', lastName: 'Kawaguchi' },
      { firstName: 'Bill', lastName: 'Stepka' }
    ];
    const expectedArr = [
      { firstName: 'Bill', lastName: 'Stepka' },
      { firstName: 'Mariko', lastName: 'Kawaguchi' },
      { firstName: 'Bob', lastName: 'Scott' }
    ];

    expect(removeDuplicates(arr)).toEqual(expectedArr);
  });

  it('keeps first occurrence by default when duplicates are equal (keepWhenEqual default)', () => {
    const arr = ['a', 'b', 'a', 'c', 'b'];
    expect(removeDuplicates(arr)).toEqual(['a', 'b', 'c']);
  });

  it('keeps second occurrence when keepWhenEqual is "second" (primitives)', () => {
    const arr = ['a', 'b', 'a', 'c', 'b'];
    expect(removeDuplicates(arr, { keepWhenEqual: 'second' })).toEqual(['a', 'c', 'b']);
  });

  it('keeps second occurrence when keepWhenEqual is "second" (objects)', () => {
    const arr = [
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
      { id: 1, name: 'later' }
    ];
    expect(removeDuplicates(arr, { keepWhenEqual: 'second', props: ['id'] })).toEqual([
      { id: 2, name: 'second' },
      { id: 1, name: 'later' }
    ]);
  });

  it('removes duplicates based on provided properties only', () => {
    const arr = [
      { firstName: 'Bill', lastName: 'Stepka', city: 'San Francisco' },
      { firstName: 'Mariko', lastName: 'Kawaguchi', city: 'Alameda' },
      { firstName: 'Bill', lastName: 'Stepka', city: 'San Francisco' },
      { firstName: 'Bill', lastName: 'Polka', city: 'San Francisco' },
      { firstName: 'Mariko', lastName: 'Kawaguchi', city: 'Alameda' },
      { firstName: 'Bob', lastName: 'Scott', city: 'Burlingame' },
      { firstName: 'Bill', lastName: 'Stepka', city: 'Alameda' }
    ];
    const expectedArr = [
      { firstName: 'Bill', lastName: 'Stepka', city: 'San Francisco' },
      { firstName: 'Mariko', lastName: 'Kawaguchi', city: 'Alameda' },
      { firstName: 'Bill', lastName: 'Polka', city: 'San Francisco' },
      { firstName: 'Bob', lastName: 'Scott', city: 'Burlingame' }
    ];

    expect(removeDuplicates(arr, { props: ['firstName', 'lastName'] })).toEqual(expectedArr);
  });

  it('uses comparisonFunc when provided and ignores props', () => {
    const arr = [
      { key: 1, tag: 'a' },
      { key: 2, tag: 'b' },
      { key: 1, tag: 'different' }
    ];
    const compareByKey = (a: typeof arr[0], b: typeof arr[0]) => a.key === b.key;
    expect(removeDuplicates(arr, { comparisonFunc: compareByKey, props: ['key', 'tag'] })).toEqual([
      { key: 1, tag: 'a' },
      { key: 2, tag: 'b' }
    ]);
  });

  it('passes the full array as third argument to comparisonFunc', () => {
    const arr = [1, 2, 1, 3];
    const comparisonFunc = (a: number, b: number, fullArr?: readonly number[]) => {
      expect(fullArr).toBe(arr);
      return a === b;
    };
    expect(removeDuplicates(arr, { comparisonFunc })).toEqual([1, 2, 3]);
  });

  it('passes the full array as third argument to selector', () => {
    const arr = [
      { id: 1, score: 10 },
      { id: 1, score: 20 }
    ];
    const selector = (a: typeof arr[0], b: typeof arr[0], fullArr?: readonly typeof arr[0][]) => {
      expect(fullArr).toBe(arr);
      return b.score - a.score;
    };
    expect(removeDuplicates(arr, { comparisonFunc: (a, b) => a.id === b.id, selector })).toEqual([{ id: 1, score: 10 }]);
  });

  it('removes duplicate Date instances', () => {
    const d = new Date('2020-01-01');
    const arr = [d, new Date('2020-01-01'), d, new Date('2020-06-01')];
    const result = removeDuplicates(arr);
    expect(result).toHaveLength(2);
    expect(result[0].getTime()).toBe(d.getTime());
    expect(result[1].getTime()).toBe(new Date('2020-06-01').getTime());
  });

  it('handles multiple consecutive duplicates and interleaved duplicates', () => {
    const arr = [1, 1, 1, 2, 2, 1, 2, 3, 3, 1];
    expect(removeDuplicates(arr)).toEqual([1, 2, 3]);
  });

  it('when selector keeps current (second), the kept item appears at end of result', () => {
    const arr = [
      { id: 1, v: 'first' },
      { id: 1, v: 'last' },
      { id: 2, v: 'second' }
    ];
    const selector = (a: typeof arr[0], b: typeof arr[0]) => (b.v === 'last' ? -1 : 1);
    const result = removeDuplicates(arr, { props: ['id'], selector });
    expect(result).toEqual([
      { id: 1, v: 'last' },
      { id: 2, v: 'second' }
    ]);
  });

  it('works with no options', () => {
    expect(removeDuplicates([1, 2, 1])).toEqual([1, 2]);
  });

  it('consolidates empty values', () => {
    const arr = [
      { firstName: 'Bill', lastName: 'Stepka' },
      { firstName: 'Mariko', lastName: 'Kawaguchi' },
      null,
      { firstName: 'Bill', lastName: 'Stepka' },
      null,
      { firstName: 'Bob', lastName: 'Scott' },
      null,
      {}
    ];
    const expectedArr = [
      { firstName: 'Bill', lastName: 'Stepka' },
      { firstName: 'Mariko', lastName: 'Kawaguchi' },
      null,
      { firstName: 'Bob', lastName: 'Scott' },
      {}
    ];

    expect(removeDuplicates(arr)).toEqual(expectedArr);
  });

  it('selects who to keep based on the provided selector', () => {
    const arr = [
      { firstName: 'Bill', lastName: 'Stepka', age: 40 },
      { firstName: 'Mariko', lastName: 'Kawaguchi', age: 30 },
      { firstName: 'Bill', lastName: 'Stepka', age: 50 }
    ];

    const selectorAsc = (person1: typeof arr[0], person2: typeof arr[0]) => person1.age - person2.age;
    const selectorDsc = (person1: typeof arr[0], person2: typeof arr[0]) => person2.age - person1.age;

    const sutAsc = removeDuplicates(arr, { selector: selectorAsc, props: ['firstName', 'lastName'] });
    const sutDsc = removeDuplicates(arr, { selector: selectorDsc, props: ['firstName', 'lastName'] });

    const expectedAsc = [
      { firstName: 'Mariko', lastName: 'Kawaguchi', age: 30 },
      { firstName: 'Bill', lastName: 'Stepka', age: 50 }
    ];
    const expectedDsc = [
      { firstName: 'Bill', lastName: 'Stepka', age: 40 },
      { firstName: 'Mariko', lastName: 'Kawaguchi', age: 30 }
    ];

    expect(sutAsc).toEqual(expectedAsc);
    expect(sutDsc).toEqual(expectedDsc);
  });

  it('select the first in the array by default when selector also finds equality', () => {
    const arr = [
      { firstName: 'Bill', lastName: 'Stepka', position: 'developer', age: 40 },
      { firstName: 'Mariko', lastName: 'Kawaguchi', position: 'developer', age: 30 },
      { firstName: 'Bill', lastName: 'Stepka', position: 'tester', age: 40 }
    ];

    const sut = removeDuplicates(arr, { selector: (person1: typeof arr[0], person2: typeof arr[0]) => person1.age - person2.age, props: ['firstName', 'lastName'] });

    const expected = [
      { firstName: 'Bill', lastName: 'Stepka', position: 'developer', age: 40 },
      { firstName: 'Mariko', lastName: 'Kawaguchi', position: 'developer', age: 30 }
    ];

    expect(sut).toEqual(expected);
  });

  it('select the second in the array when keepWhenEqual is set to second', () => {
    const arr = [
      { firstName: 'Bill', lastName: 'Stepka', position: 'developer', age: 40 },
      { firstName: 'Mariko', lastName: 'Kawaguchi', position: 'developer', age: 30 },
      { firstName: 'Bill', lastName: 'Stepka', position: 'tester', age: 40 }
    ];

    const sut = removeDuplicates(arr, { selector: (person1: typeof arr[0], person2: typeof arr[0]) => person1.age - person2.age, props: ['firstName', 'lastName'], keepWhenEqual: 'second' });

    const expected = [
      { firstName: 'Mariko', lastName: 'Kawaguchi', position: 'developer', age: 30 },
      { firstName: 'Bill', lastName: 'Stepka', position: 'tester', age: 40 }
    ];

    expect(sut).toEqual(expected);
  });

  it('ignore array order when checking for duplicates', () => {
    const arr = [
      { prop1: 'one', propArr: [1, 2, 3, 4] },
      { prop1: 'two', propArr: [1, 2, 3, 4] },
      { prop1: 'one', propArr: [4, 3, 2, 1] }
    ];

    expect(removeDuplicates(arr)).toEqual([arr[0], arr[1]]);
  });

  it('does not ignore array order if default option is turned off', () => {
    const arr = [
      { prop1: 'one', propArr: [1, 2, 3, 4] },
      { prop1: 'two', propArr: [1, 2, 3, 4] },
      { prop1: 'one', propArr: [4, 3, 2, 1] }
    ];

    expect(removeDuplicates(arr, { ignoreArrayOrder: false })).toEqual(arr);
  });

  it('selector returning positive keeps existing (first) occurrence', () => {
    const arr = [
      { id: 1, version: 2 },
      { id: 1, version: 1 }
    ];
    const selector = (a: typeof arr[0], b: typeof arr[0]) => a.version - b.version;
    expect(removeDuplicates(arr, { props: ['id'], selector })).toEqual([{ id: 1, version: 2 }]);
  });

  it('selector returning negative keeps current (second) occurrence', () => {
    const arr = [
      { id: 1, version: 1 },
      { id: 1, version: 2 }
    ];
    const selector = (a: typeof arr[0], b: typeof arr[0]) => a.version - b.version;
    expect(removeDuplicates(arr, { props: ['id'], selector })).toEqual([{ id: 1, version: 2 }]);
  });

  it('handles array of mixed types when comparisonFunc defines equality', () => {
    const arr = [1, 'one', 1, 2, 'one', 'two'];
    expect(removeDuplicates(arr, { comparisonFunc: sameForMixedTypes })).toEqual([1, 'one', 2, 'two']);
  });

  it('returns new array reference (result is not input reference)', () => {
    const arr = [1, 2, 3];
    const result = removeDuplicates(arr);
    expect(result).not.toBe(arr);
    expect(result).toEqual(arr);
  });
});
