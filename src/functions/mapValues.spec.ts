import mapValues from './mapValues';


/**
 * mapValues TESTS
 *
 * @group unit/mapValues
 * @group only
 */


function stringMapper(val: string) {
  return `${val}!`;
}

function predicate(val: any) {
  return typeof val === typeof 'string';
}


describe('mapObject', () => {

  it('applies the mapper on all properties of an object', () => {
    const obj = {
      one: 'one',
      two: 2,
      three: 'three'
    };

    const result = mapValues(obj, stringMapper);

    expect(result).toEqual({ one: 'one!', two: '2!', three: 'three!' });
  });

  it('applies the mapper on all cell in array', () => {
    const arr = ['one', 2, 'three'];

    const result = mapValues(arr, stringMapper);

    expect(result).toEqual(['one!', '2!', 'three!']);
  });

  it('does not apply the mapper on any argument that is not array or object with properties', () => {
    const num = 2;

    const result = mapValues(num, stringMapper);

    expect(result).toBe(2);
  });

  it('does not apply the mapper on any boolean value', () => {
    const bool = true;

    expect(mapValues(bool, stringMapper)).toBe(true);
  });

  it('does not apply the mapper on empty values', () => {
    expect(mapValues(undefined, stringMapper)).toBeUndefined();
    expect(mapValues(null, stringMapper)).toBeNull();
    expect(mapValues(Number.NaN, stringMapper)).toBeNaN();
  });

  it('does not apply mapper on empty properties by default', () => {
    const objWithEmpty = {
      one: 'one',
      two: null,
      three: undefined
    };

    expect(mapValues(objWithEmpty, stringMapper)).toEqual({ one: 'one!', two: null, three: undefined });
  });

  it('applies the mapper on empty values when option is set', () => {
    const objWithEmpty = {
      one: 'one',
      two: null,
      three: undefined
    };

    expect(mapValues(objWithEmpty, stringMapper, { ignoreEmpty: false })).toEqual({ one: 'one!', two: 'null!', three: 'undefined!' });
  });

  it('does not apply the mapper on sub fields that are empty values', () => {
    const obj = { blah: undefined, str: 'hay' };

    const result = mapValues(obj, (val) => `${val}o`);

    expect(result).toEqual({ blah: undefined, str: 'hayo' });
  });

  it('applies the mapper on sub-properties of an object', () => {
    const obj = {
      one: 'one',
      two: 2,
      three: { prop: 'three' }
    };

    const result = mapValues(obj, stringMapper);

    expect(result).toEqual({ one: 'one!', two: '2!', three: { prop: 'three!' } });
  });

  it('applies the mapper on cells of arrays inside an array', async () => {
    const arr = ['one', ['two', 3], 4];

    const result = mapValues(arr, stringMapper);

    expect(result).toEqual(['one!', ['two!', '3!'], '4!']);
  });

  it('applies the mapper on properties of objects inside array', () => {
    const arr = ['one', { two: 2, three: 'three' }, 4];

    const result = mapValues(arr, stringMapper);

    expect(result).toEqual(['one!', { two: '2!', three: 'three!' }, '4!']);
  });

  it('applies the mapper on cells of array inside an object', () => {
    const obj = {
      one: 'one',
      arr: ['two', 3],
      four: 4
    };

    const result = mapValues(obj, stringMapper);

    expect(result).toEqual({ one: 'one!', arr: ['two!', '3!'], four: '4!' });
  });

  it('only applies the mapping on properties that fulfill the predicate', () => {
    const obj = {
      one: 'one',
      two: 2,
      three: 'three'
    };

    const result = mapValues(obj, stringMapper, { predicate });

    expect(result).toEqual({ one: 'one!', two: 2, three: 'three!' });
  });

  it('only applies the mapping on sub-fields that fulfill the predicate', () => {
    const obj = {
      one: 'one',
      two: 2,
      three: { prop: 'three', boom: 4 }
    };

    const result = mapValues(obj, stringMapper, { predicate });

    expect(result).toEqual({ one: 'one!', two: 2, three: { prop: 'three!', boom: 4 } });
  });

  it('only applies the mapping on array cells that fulfill the predicate', () => {
    const arr = ['one', 2, 'three'];

    const result = mapValues(arr, stringMapper, { predicate });

    expect(result).toEqual(['one!', 2, 'three!']);
  });

  it('only applies the mapping on properties of objects inside array that fulfill the predicate', () => {
    const arr = ['one', { two: 2, three: 'three' }, 4];

    const result = mapValues(arr, stringMapper, { predicate });

    expect(result).toEqual(['one!', { two: 2, three: 'three!' }, 4]);
  });

  it('only applies the mapping on cells of arrays inside an object that fulfill the predicate', () => {
    const obj = {
      one: 'one',
      arr: ['two', 3],
      four: 4
    };

    const result = mapValues(obj, stringMapper, { predicate });

    expect(result).toEqual({ one: 'one!', arr: ['two!', 3], four: 4 });
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

    const result = mapValues(obj, (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()), { predicate: (val) => val instanceof Date });

    expect(result).toEqual({
      ...obj,
      orientationDate: new Date(2000, 1, 5),
      permit: [{
        permitNumber: '12345',
        expirationDate: new Date(2020, 4, 2)
      }]
    });
  });

  it('safe from circular referencing', () => {
    const obj: any = {
      one: 'one',
      two: 2,
      three: { prop: 'three' }
    };
    obj.refThree = obj.three;
    obj.deepRefThree = { ref: obj.three };
    obj.self = obj;

    const result = mapValues(obj, stringMapper);

    expect(result).toEqual({ one: 'one!', two: '2!', three: { prop: 'three!' }, refThree: obj.three, deepRefThree: { ref: obj.three }, self: obj });
  });

  it('applies mapper on empty object properties', () => {
    const obj = { prop: {} };

    expect(mapValues(obj, stringMapper)).toEqual({ prop: {} });
  });
});
