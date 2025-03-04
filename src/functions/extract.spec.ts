import extract from './extract';


/**
 * areEqual TESTS
 *
 * @group unit/extract
 */


describe('extract', () => {

  it('returns first item that answers the predicate', () => {
    const arr = ['one', 'two', 'three'];

    const extension = extract(arr, (item: string) => item === 'two');

    expect(extension).toBe('two');
  });

  it('takes the item out of the array', () => {
    const arr = ['one', 'two', 'three'];

    extract(arr, (item: string) => item === 'two');

    expect(arr).toEqual(['one', 'three']);
  });

  it('returns only the first occurrence', () => {
    const arr = ['one', 'two', 'one', 'three'];

    const extension = extract(arr, (item: string) => item === 'one');

    expect(extension).toBe('one');
    expect(arr).toEqual(['two', 'one', 'three']);
  });

  it('returns undefined when object is not found', () => {
    const arr = ['one', 'two', 'three'];

    const extension = extract(arr, (item: string) => item === 'four');

    expect(extension).toBeUndefined();
  });

  it('works with empty array', () => {
    const arr: string[] = [];
    const extension = extract(arr, (item: string) => item === 'anything');
    expect(extension).toBeUndefined();
  });

  it('works with array of objects', () => {
    const arr = [
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
      { id: 3, name: 'third' }
    ];

    const extension = extract(arr, (item) => item.id === 2);

    expect(extension).toEqual({ id: 2, name: 'second' });
    expect(arr).toEqual([
      { id: 1, name: 'first' },
      { id: 3, name: 'third' }
    ]);
  });

  it('works with array of numbers', () => {
    const arr = [1, 2, 3, 4, 5];
    const extension = extract(arr, (num) => num % 2 === 0);
    expect(extension).toBe(2);
    expect(arr).toEqual([1, 3, 4, 5]);
  });

  it('preserves array reference', () => {
    const arr = ['one', 'two', 'three'];
    const originalReference = arr;
    extract(arr, (item) => item === 'two');
    expect(arr).toBe(originalReference);
  });

  it('handles predicate with complex logic', () => {
    const arr = ['apple', 'banana', 'cherry', 'date'];
    const extension = extract(arr, (item) => item.length > 5 && item.includes('n'));
    expect(extension).toBe('banana');
    expect(arr).toEqual(['apple', 'cherry', 'date']);
  });
});

