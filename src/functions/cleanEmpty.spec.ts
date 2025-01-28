import cleanEmpty from './cleanEmpty';


/**
 * cleanEmpty TESTS
 *
 * @group unit/cleanEmpty
 * @group only
 */


describe('cleanEmpty', () => {

  it('returns primitive as received', () => {
    expect(cleanEmpty(true)).toBe(true);
    expect(cleanEmpty(9)).toBe(9);
    expect(cleanEmpty('Str')).toBe('Str');
  });

  it('cleans out fields from object', () => {
    const obj = {
      one: 'one',
      two: undefined,
      three: {}
    };

    expect(cleanEmpty(obj)).toEqual({ one: 'one' });
  });

  it('cleans out cells from array', () => {
    const arr = ['one', undefined, {}];

    expect(cleanEmpty(arr)).toEqual(['one']);
  });

  it('cleans objects inside an array', () => {
    const arr = [
      { one: 'one', two: undefined, three: {} },
      'blah',
      42
    ];

    expect(cleanEmpty(arr)).toEqual([{ one: 'one' }, 'blah', 42]);
  });

  it('cleans arrays inside arrays', () => {
    const arr = ['one', ['two', [], null], 'three'];

    expect(cleanEmpty(arr)).toEqual(['one', ['two'], 'three']);
  });

  it('cleans arrays inside an object', () => {
    const obj = {
      one: 'one',
      arr: ['two', [], null],
      blah: 42
    };

    expect(cleanEmpty(obj)).toEqual({ one: 'one', arr: ['two'], blah: 42 });
  });

  it('cleans objects inside objects', () => {
    const obj = {
      one: 'one',
      obj: { two: 'two', no: null, blah: '' },
      foo: 42
    };

    expect(cleanEmpty(obj)).toEqual({ one: 'one', obj: { two: 'two' }, foo: 42 });
  });

  it('returns an empty object if all are empty inside', () => {
    const emptyObj = { one: null, two: undefined, three: [], four: '', five: {} };

    expect(cleanEmpty(emptyObj)).toEqual({});
  });

  it('returns an empty array if all are empty inside', () => {
    const emptyArr = [null, undefined, [], '', {}];

    expect(cleanEmpty(emptyArr)).toEqual([]);
  });

  it('replaces all empty properties with null when `completelyRemove` is set to `false`', () => {
    const obj = { a: 'a', b: '' };

    expect(cleanEmpty(obj, { completelyRemove: false })).toEqual({ a: 'a', b: null });
  });

  it('replaces all empty cells with null when `completelyRemove` is set to `false`', () => {
    const arr = ['a', ''];

    expect(cleanEmpty(arr, { completelyRemove: false })).toEqual(['a', null]);
  });

  it('replaces sub-properties with null', () => {
    const obj = {
      a: 'a',
      b: {
        c: 'c',
        d: ''
      }
    };

    expect(cleanEmpty(obj, { completelyRemove: false })).toEqual({
      a: 'a',
      b: { c: 'c', d: null }
    });
  });

  it('replaces sub-properties in cells with null', () => {
    const arr = ['a', ['b', ''], { c: 'c', d: [] }];

    expect(cleanEmpty(arr, { completelyRemove: false })).toEqual(['a', ['b', null], { c: 'c', d: null }]);
  });

  it('replaces only highest-level empty properties', () => {
    const obj = {
      a: { b: '', c: [] },
      d: { e: 'e', f: { g: '' } }
    };

    expect(cleanEmpty(obj, { completelyRemove: false })).toEqual({
      a: null,
      d: { e: 'e', f: null }
    });
  });

  it('replaces only highest-level empty properties in cells', () => {
    const arr = [['', {}], ['a', { b: '' }]];

    expect(cleanEmpty(arr, { completelyRemove: false })).toEqual([null, ['a', null]]);
  });

  it('replaces empty properties with value specified in `replaceWith`', () => {
    const obj = { a: 'a', b: '' };

    expect(cleanEmpty(obj, { completelyRemove: false, replaceWith: 0 })).toEqual({ a: 'a', b: 0 });
  });
});