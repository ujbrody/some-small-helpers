import probabilityArray, { ProbabilityItem } from './probabilityArray';


/**
 * cleanEmpty TESTS
 *
 * @group unit/cleanEmpty
 */


describe('probabilityArray', () => {

  it('generates array that matches the probability elements', () => {
    const arr = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1]);
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(30);
    expect(bar).toHaveLength(60);
    expect(blah).toHaveLength(10);
  });

  it('accepts two digits after the dot', () => {
    const arr = probabilityArray(['foo', 0.33], ['bar', 0.55], ['blah', 0.12]);
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(33);
    expect(bar).toHaveLength(55);
    expect(blah).toHaveLength(12);
  });

  it('rounds decimals to two digits after the dot', () => {
    const arr = probabilityArray(['foo', 0.334], ['bar', 0.5572], ['blah', 0.129_01]);
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(33);
    expect(bar).toHaveLength(55);
    expect(blah).toHaveLength(12);
  });

  it('cut off arguments that exceed 100 total', () => {
    const arr = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1], ['boom', 0.3]);
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');
    const boom = arr.filter((item) => item === 'boom');

    expect(foo).toHaveLength(30);
    expect(bar).toHaveLength(60);
    expect(blah).toHaveLength(10);
    expect(boom).toHaveLength(0);
  });

  it('reduces the first argument that complete 100 partially as default', () => {
    const arr = probabilityArray(['foo', 0.3], ['bar', 0.4], ['blah', 0.2], ['boom', 0.3]);
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');
    const boom = arr.filter((item) => item === 'boom');

    expect(foo).toHaveLength(30);
    expect(bar).toHaveLength(40);
    expect(blah).toHaveLength(20);
    expect(boom).toHaveLength(10);
  });

  it('completely eliminates arguments that exceed 100', () => {
    const arr = probabilityArray(['foo', 0.3], ['bar', 0.4], ['blah', 0.4], ['boom', 0.3]);
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');
    const boom = arr.filter((item) => item === 'boom');

    expect(foo).toHaveLength(30);
    expect(bar).toHaveLength(40);
    expect(blah).toHaveLength(30); // This one was also shortened
    expect(boom).toHaveLength(0);
  });

  it('returns shorter array if total sum does not come up to 100', () => {
    const arr = probabilityArray(['foo', 0.3], ['bar', 0.4], ['blah', 0.2]);
    expect(arr).toHaveLength(90);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(30);
    expect(bar).toHaveLength(40);
    expect(blah).toHaveLength(20);
  });

  it('consolidates arguments that are the same', () => {
    const arr = probabilityArray(['foo', 0.2], ['bar', 0.6], ['blah', 0.1], ['foo', 0.1]);
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(30);
    expect(bar).toHaveLength(60);
    expect(blah).toHaveLength(10);
  });

  it('generates the array in incoming order by default', () => {
    const arr1 = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1]);
    const arr2 = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.1]], { sortOrder: 'incoming' });
    expect(arr1).toHaveLength(100);
    expect(arr2).toHaveLength(100);

    const foo1 = arr1.slice(0, 30);
    const bar1 = arr1.slice(30, 90);
    const blah1 = arr1.slice(90);

    const foo2 = arr2.slice(0, 30);
    const bar2 = arr2.slice(30, 90);
    const blah2 = arr2.slice(90);

    expect(foo1).toEqual(Array.from({ length: 30 }, () => 'foo'));
    expect(bar1).toEqual(Array.from({ length: 60 }, () => 'bar'));
    expect(blah1).toEqual(Array.from({ length: 10 }, () => 'blah'));

    expect(foo2).toEqual(Array.from({ length: 30 }, () => 'foo'));
    expect(bar2).toEqual(Array.from({ length: 60 }, () => 'bar'));
    expect(blah2).toEqual(Array.from({ length: 10 }, () => 'blah'));

    expect(arr1).toEqual(arr2);
  });

  it('generates array in order from the least common item to the most common when option is set to "asc"', () => {
    const arr = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.1]], { sortOrder: 'asc' });
    expect(arr).toHaveLength(100);

    const blah = arr.slice(0, 10);
    const foo = arr.slice(10, 40);
    const bar = arr.slice(40);

    expect(blah).toEqual(Array.from({ length: 10 }, () => 'blah'));
    expect(foo).toEqual(Array.from({ length: 30 }, () => 'foo'));
    expect(bar).toEqual(Array.from({ length: 60 }, () => 'bar'));
  });

  it('generates array in order from the most common item to the least common when option is set to "desc"', () => {
    const arr = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.1]], { sortOrder: 'desc' });
    expect(arr).toHaveLength(100);

    const bar = arr.slice(0, 60);
    const foo = arr.slice(60, 90);
    const blah = arr.slice(90);

    expect(bar).toEqual(Array.from({ length: 60 }, () => 'bar'));
    expect(foo).toEqual(Array.from({ length: 30 }, () => 'foo'));
    expect(blah).toEqual(Array.from({ length: 10 }, () => 'blah'));
  });

  it('generates a array with a circular repetition of items when option is set to "circular"', () => {
    const arr = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.1]], { sortOrder: 'circular' });
    expect(arr).toHaveLength(100);

    const options = ['foo', 'bar', 'blah'];

    for (let i = 0; i < 30; i += 1) {
      // For the first 30 items, the items should be in the order of 'foo', 'bar', 'blah'
      const item = arr[i];
      const indexInOptions = i % options.length;

      expect(item).toEqual(options[indexInOptions]);
    }

    options.pop();

    for (let i = 30; i < 70; i += 1) {
      // For the next 40 items, the items should be in the order of 'foo', 'bar'
      const item = arr[i];
      const indexInOptions = i % options.length;

      expect(item).toEqual(options[indexInOptions]);
    }

    // All that remains in the end is just 'bar'
    expect(arr.slice(70)).toEqual(Array.from({ length: 30 }, () => 'bar'));
  });

  it('generates an array with random distribution of the items when option is set to "random"', () => {
    const arr1 = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.1]], { sortOrder: 'random' });
    const arr2 = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.1]], { sortOrder: 'random' });
    const arr3 = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.1]], { sortOrder: 'random' });
    expect(arr1).toHaveLength(100);
    expect(arr2).toHaveLength(100);
    expect(arr3).toHaveLength(100);

    const foo1 = arr1.filter((item) => item === 'foo');
    const bar1 = arr1.filter((item) => item === 'bar');
    const blah1 = arr1.filter((item) => item === 'blah');

    const foo2 = arr2.filter((item) => item === 'foo');
    const bar2 = arr2.filter((item) => item === 'bar');
    const blah2 = arr2.filter((item) => item === 'blah');

    const foo3 = arr3.filter((item) => item === 'foo');
    const bar3 = arr3.filter((item) => item === 'bar');
    const blah3 = arr3.filter((item) => item === 'blah');

    expect(foo1).toHaveLength(30);
    expect(bar1).toHaveLength(60);
    expect(blah1).toHaveLength(10);

    expect(foo2).toHaveLength(30);
    expect(bar2).toHaveLength(60);
    expect(blah2).toHaveLength(10);

    expect(foo3).toHaveLength(30);
    expect(bar3).toHaveLength(60);
    expect(blah3).toHaveLength(10);

    expect(arr1).not.toEqual(arr2);
    expect(arr1).not.toEqual(arr3);
    expect(arr2).not.toEqual(arr3);
  });

  it('reduces the size of the biggest array if option in case they all exceed 100 is set to "biggest"', () => {
    const arr = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.1], ['boom', 0.3]], { cutoff: 'biggest' });
    expect(arr).toHaveLength(100);

    const bar = arr.filter((item) => item === 'bar');

    expect(bar).toHaveLength(30);
  });

  it('reduces the size of the smallest array if option in case they all exceed 100 is set to "smallest"', () => {
    const arr = probabilityArray([['foo', 0.3], ['bar', 0.3], ['blah', 0.2], ['boom', 0.3]], { cutoff: 'smallest' });
    expect(arr).toHaveLength(100);

    const blah = arr.filter((item) => item === 'blah');

    expect(blah).toHaveLength(10);
  });

  it('normalizes the sizes of the arrays if option in case they all exceed 100 is set to "normalize"', () => {
    const arr = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.3]], { cutoff: 'normalize' });
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(25);
    expect(bar).toHaveLength(50);
    expect(blah).toHaveLength(25);
  });

  it('retains at least one cell in parts that are so small that under normalization will be eliminated', () => {
    const arr = probabilityArray([['foo', 0.49], ['bar', 0.6], ['blah', 0.01]], { cutoff: 'normalize' });
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(44);
    expect(bar).toHaveLength(54);
    expect(blah).toHaveLength(2);
  });

  it('reduce the array parts as evenly as possible (numerically) when exceeding 100 and option is set to "spread"', () => {
    const arr = probabilityArray([['foo', 0.3], ['bar', 0.6], ['blah', 0.2], ['boom', 0.3]], { cutoff: 'spread' });
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');
    const boom = arr.filter((item) => item === 'boom');

    expect(foo).toHaveLength(20);
    expect(bar).toHaveLength(50);
    expect(blah).toHaveLength(10);
    expect(boom).toHaveLength(20);
  });

  it('retains at least one cell in parts that are so small that under spread will be eliminated', () => {
    const arr = probabilityArray([['foo', 0.5], ['bar', 0.6], ['blah', 0.01]], { cutoff: 'spread' });
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(44);
    expect(bar).toHaveLength(55);
    expect(blah).toHaveLength(1);
  });

  it('does not modify the input', () => {
    const input: ProbabilityItem<string>[] = [['foo', 0.3], ['bar', 0.6], ['blah', 0.6]];
    const arr = probabilityArray(...input);
    expect(arr).toHaveLength(100);

    expect(input).toEqual([['foo', 0.3], ['bar', 0.6], ['blah', 0.6]]);
  });

  it('treats negative numbers as 0', () => {
    const arr = probabilityArray([['foo', 0.3], ['bar', -0.6], ['blah', 0.1]]);
    expect(arr).toHaveLength(40);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(30);
    expect(bar).toHaveLength(0);
    expect(blah).toHaveLength(10);
  });

  it('consolidates with negative numbers', () => {
    const arr = probabilityArray([['foo', 0.3], ['bar', -0.2], ['blah', 0.1], ['bar', 0.8]]);
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(30);
    expect(bar).toHaveLength(60);
    expect(blah).toHaveLength(10);
  });

  it('removes values with accumulative ratio smaller than 0 when reducing the size of the array', () => {
    const arr = probabilityArray([['foo', 0.7], ['bar', -0.6], ['blah', 0.4], ['bar', 0.3]]);
    expect(arr).toHaveLength(100);

    const foo = arr.filter((item) => item === 'foo');
    const bar = arr.filter((item) => item === 'bar');
    const blah = arr.filter((item) => item === 'blah');

    expect(foo).toHaveLength(70);
    expect(bar).toHaveLength(0);
    expect(blah).toHaveLength(30);
  });

  it('accepts loose args with a trailing options object (sortOrder: "incoming")', () => {
    const arr1 = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1]);
    const arr2 = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1], { sortOrder: 'incoming' });

    expect(arr1).toHaveLength(100);
    expect(arr2).toHaveLength(100);
    expect(arr2).toEqual(arr1);
  });

  it('accepts loose args with a trailing options object (sortOrder: "asc")', () => {
    const arr = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1], { sortOrder: 'asc' });
    expect(arr).toHaveLength(100);

    const blah = arr.slice(0, 10);
    const foo = arr.slice(10, 40);
    const bar = arr.slice(40);

    expect(blah).toEqual(Array.from({ length: 10 }, () => 'blah'));
    expect(foo).toEqual(Array.from({ length: 30 }, () => 'foo'));
    expect(bar).toEqual(Array.from({ length: 60 }, () => 'bar'));
  });

  it('accepts loose args with a trailing options object (sortOrder: "desc")', () => {
    const arr = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1], { sortOrder: 'desc' });
    expect(arr).toHaveLength(100);

    const bar = arr.slice(0, 60);
    const foo = arr.slice(60, 90);
    const blah = arr.slice(90);

    expect(bar).toEqual(Array.from({ length: 60 }, () => 'bar'));
    expect(foo).toEqual(Array.from({ length: 30 }, () => 'foo'));
    expect(blah).toEqual(Array.from({ length: 10 }, () => 'blah'));
  });

  it('accepts loose args with a trailing options object (sortOrder: "circular")', () => {
    const arr = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1], { sortOrder: 'circular' });
    expect(arr).toHaveLength(100);

    const options = ['foo', 'bar', 'blah'];

    for (let i = 0; i < 30; i += 1) {
      const item = arr[i];
      const indexInOptions = i % options.length;

      expect(item).toEqual(options[indexInOptions]);
    }

    options.pop();

    for (let i = 30; i < 70; i += 1) {
      const item = arr[i];
      const indexInOptions = i % options.length;

      expect(item).toEqual(options[indexInOptions]);
    }

    expect(arr.slice(70)).toEqual(Array.from({ length: 30 }, () => 'bar'));
  });

  it('accepts loose args with a trailing options object (sortOrder: "random")', () => {
    const arr1 = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1], { sortOrder: 'random' });
    const arr2 = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1], { sortOrder: 'random' });
    const arr3 = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1], { sortOrder: 'random' });

    expect(arr1).toHaveLength(100);
    expect(arr2).toHaveLength(100);
    expect(arr3).toHaveLength(100);

    const foo1 = arr1.filter((item) => item === 'foo');
    const bar1 = arr1.filter((item) => item === 'bar');
    const blah1 = arr1.filter((item) => item === 'blah');

    const foo2 = arr2.filter((item) => item === 'foo');
    const bar2 = arr2.filter((item) => item === 'bar');
    const blah2 = arr2.filter((item) => item === 'blah');

    const foo3 = arr3.filter((item) => item === 'foo');
    const bar3 = arr3.filter((item) => item === 'bar');
    const blah3 = arr3.filter((item) => item === 'blah');

    expect(foo1).toHaveLength(30);
    expect(bar1).toHaveLength(60);
    expect(blah1).toHaveLength(10);

    expect(foo2).toHaveLength(30);
    expect(bar2).toHaveLength(60);
    expect(blah2).toHaveLength(10);

    expect(foo3).toHaveLength(30);
    expect(bar3).toHaveLength(60);
    expect(blah3).toHaveLength(10);

    expect(arr1).not.toEqual(arr2);
    expect(arr1).not.toEqual(arr3);
    expect(arr2).not.toEqual(arr3);
  });

  it('accepts loose args with a trailing options object (cutoff: "biggest")', () => {
    const arr = probabilityArray(['foo', 0.3], ['bar', 0.6], ['blah', 0.1], ['boom', 0.3], { cutoff: 'biggest' });
    expect(arr).toHaveLength(100);

    const bar = arr.filter((item) => item === 'bar');

    expect(bar).toHaveLength(30);
  });

  it('throws error if no ProbabilityItems were provided (empty call)', () => {
    expect(() => (probabilityArray as unknown as (...a: unknown[]) => unknown)()).toThrow();
  });

  it('throws error if no ProbabilityItems were provided (options only)', () => {
    expect(() => (probabilityArray as unknown as (...a: unknown[]) => unknown)({ sortOrder: 'asc' })).toThrow();
  });

  it('throws error if not all provided items are ProbabilityItems (bad varargs item)', () => {
    expect(() => (probabilityArray as unknown as (...a: unknown[]) => unknown)(['foo', 0.3], 'nope')).toThrow();
  });

  it('throws error if not all provided items are ProbabilityItems (bad tuple shape)', () => {
    expect(() => (probabilityArray as unknown as (...a: unknown[]) => unknown)(['foo', '0.3'])).toThrow();
  });

  it('throws error if not all provided items are ProbabilityItems (array form but contains invalid cell)', () => {
    expect(() => (probabilityArray as unknown as (...a: unknown[]) => unknown)([['foo', 0.3], ['bar', '0.6']])).toThrow();
  });

  it('throws error if not all provided items are ProbabilityItems (varargs + options but contains invalid cell)', () => {
    expect(() => (probabilityArray as unknown as (...a: unknown[]) => unknown)(['foo', 0.3], ['bar', '0.6'], { sortOrder: 'incoming' })).toThrow();
  });
});
