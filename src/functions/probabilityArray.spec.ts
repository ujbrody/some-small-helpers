import probabilityArray from './probabilityArray';

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
    const arr = probabilityArray(['foo', 0.334], ['bar', 0.5572], ['blah', 0.12901]);
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

  it('reduces the first argument that complete 100 partially', () => {
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

  // it('is used by the randomator for a good probability for random selection', () => {
  //   const randomator = probableRandomator(['foo', 0.3], ['bar', 0.6], ['blah', 0.1]);
  //   const foo: string[] = [];
  //   const bar: string[] = [];
  //   const blah: string[] = [];

  //   for (let i = 0; i < 1000; i += 1) {
  //     const item = randomator();

  //     if (item === 'foo') {
  //       foo.push(item);
  //     }
  //     if (item === 'bar') {
  //       bar.push(item);
  //     }
  //     if (item === 'blah') {
  //       blah.push(item);
  //     }
  //   }

  //   expect(bar.length).toBeGreaterThan(foo.length);
  //   expect(foo.length).toBeGreaterThan(blah.length);
  // });
});