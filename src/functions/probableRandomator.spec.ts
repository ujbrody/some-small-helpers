import probableRandomator from "./probableRandomator";

/**
 * probableRandomator TESTS
 *
 * @group unit/probableRandomator
 */

describe('probableRandomator', () => {
  
  it('is used by the randomator for a good probability for random selection', () => {
    const randomator = probableRandomator(['foo', 0.3], ['bar', 0.6], ['blah', 0.1]);
    const foo: string[] = [];
    const bar: string[] = [];
    const blah: string[] = [];

    for (let i = 0; i < 1000; i += 1) {
      const item = randomator();

      if (item === 'foo') {
        foo.push(item);
      }
      if (item === 'bar') {
        bar.push(item);
      }
      if (item === 'blah') {
        blah.push(item);
      }
    }

    expect(bar.length).toBeGreaterThan(foo.length);
    expect(foo.length).toBeGreaterThan(blah.length);
  });
});