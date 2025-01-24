import mapObject from './mapObject';


/**
 * mapObject TESTS
 *
 * @group unit/mapObject
 * @group only
 */


describe('mapObject', () => {

  function stringMapper(val: string) {
    return `${val}!`;
  }

  function predicate(val: any) {
    return typeof val === typeof 'string';
  }

  it('applies the mapper on all properties of an object', () => {
    const obj = {
      one: 'one',
      two: 2,
      three: 'three'
    };

    const res = mapObject(obj, stringMapper);

    expect(res).toEqual({ one: 'one!', two: '2!', three: 'three!' });
  });

  it('applies the mapper on all cell in array', () => {
    const arr = ['one', 2, 'three'];

    const res = mapObject(arr, stringMapper);

    expect(res).toEqual(['one!', '2!', 'three!']);
  });

  it('does not apply the mapper on any argument that is not array or object with properties', () => {
    const num = 2;

    const res = mapObject(num, stringMapper);

    expect(res).toBe(2);
  });

  it('does not apply the mapper on any boolean value', () => {
    const bool = true;

    expect(mapObject(bool, stringMapper)).toBe(true);
  });

  it('does not apply the mapper on empty values', () => {
    expect(mapObject(undefined, stringMapper)).toBeUndefined();
    expect(mapObject(null, stringMapper)).toBeNull();
    expect(mapObject(Number.NaN, stringMapper)).toBeNaN();
  });

  it('does not apply the mapper on sub fields that are empty values', () => {
    const obj = { blah: undefined, str: 'hay' };

    const res = mapObject(obj, (val) => `${val}o`);

    expect(res).toEqual({ blah: undefined, str: 'hayo' });
  });

  it('applies the mapper on sub-properties of an object', () => {
    const obj = {
      one: 'one',
      two: 2,
      three: { prop: 'three' }
    };

    const res = mapObject(obj, stringMapper);

    expect(res).toEqual({ one: 'one!', two: '2!', three: { prop: 'three!' } });
  });

  it('applies the mapper on cells of arrays inside an array', async () => {
    const arr = ['one', ['two', 3], 4];

    const res = mapObject(arr, stringMapper);

    expect(res).toEqual(['one!', ['two!', '3!'], '4!']);
  });

  it('applies the mapper on properties of objects inside array', () => {
    const arr = ['one', { two: 2, three: 'three' }, 4];

    const res = mapObject(arr, stringMapper);

    expect(res).toEqual(['one!', { two: '2!', three: 'three!' }, '4!']);
  });

  it('applies the mapper on cells of array inside an object', () => {
    const obj = {
      one: 'one',
      arr: ['two', 3],
      four: 4
    };

    const res = mapObject(obj, stringMapper);

    expect(res).toEqual({ one: 'one!', arr: ['two!', '3!'], four: '4!' });
  });

  it('only applies the mapping on properties that fulfill the predicate', () => {
    const obj = {
      one: 'one',
      two: 2,
      three: 'three'
    };

    const res = mapObject(obj, stringMapper, predicate);

    expect(res).toEqual({ one: 'one!', two: 2, three: 'three!' });
  });

  it('only applies the mapping on sub-fields that fulfill the predicate', () => {
    const obj = {
      one: 'one',
      two: 2,
      three: { prop: 'three', boom: 4 }
    };

    const res = mapObject(obj, stringMapper, predicate);

    expect(res).toEqual({ one: 'one!', two: 2, three: { prop: 'three!', boom: 4 } });
  });

  it('only applies the mapping on array cells that fulfill the predicate', () => {
    const arr = ['one', 2, 'three'];

    const res = mapObject(arr, stringMapper, predicate);

    expect(res).toEqual(['one!', 2, 'three!']);
  });

  it('only applies the mapping on properties of objects inside array that fulfill the predicate', () => {
    const arr = ['one', { two: 2, three: 'three' }, 4];

    const res = mapObject(arr, stringMapper, predicate);

    expect(res).toEqual(['one!', { two: 2, three: 'three!' }, 4]);
  });

  it('only applies the mapping on cells of arrays inside an object that fulfill the predicate', () => {
    const obj = {
      one: 'one',
      arr: ['two', 3],
      four: 4
    };

    const res = mapObject(obj, stringMapper, predicate);

    expect(res).toEqual({ one: 'one!', arr: ['two!', 3], four: 4 });
  });

  it('able to treat only fields identified as Date in a complex object that has empty fields (edge case)', () => {
    const obj = {
      name: 'Bill',
      phones: [],
      hasCar: true,
      nickname: '',
      address: { street: '', city: { cityName: '', state: '' }, zipCode: '' },
      orientationDate: new Date(2000, 1, 5, 11, 30),
      permit: [{
        permitNumber: '12345',
        expirationDate: new Date(2020, 4, 2, 7, 24)
      }]
    };

    const res = mapObject(obj, (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()), (val) => val instanceof Date);

    expect(res).toEqual({
      ...obj,
      orientationDate: new Date(2000, 1, 5),
      permit: [{
        permitNumber: '12345',
        expirationDate: new Date(2020, 4, 2)
      }]
    });
  });
});