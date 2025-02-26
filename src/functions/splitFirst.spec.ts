import splitFirst from './splitFirst';


/**
 * splitFirst TESTS
 *
 * @group unit/splitFirst
 */


describe('splitFirst', () => {

  it('split string only at first occurrence', () => {
    const str = 'one|two|three|four';
    const expected = ['one', 'two|three|four'];

    expect(splitFirst(str, '|')).toEqual(expected);
  });

  it('split string at first occurrence with multi-letter divider', () => {
    const str = 'one|:;two|:;three|:;four';
    const expected = ['one', 'two|:;three|:;four'];

    expect(splitFirst(str, '|:;')).toEqual(expected);
  });

  it('makes the split when divider is found only once in the string', () => {
    const str = 'one|is a small number';
    const expected = ['one', 'is a small number'];

    expect(splitFirst(str, '|')).toEqual(expected);
  });

  it('returns array with a single string when no divider was found', () => {
    const str = 'one is a small number';

    expect(splitFirst(str, '|')).toEqual([str]);
  });

  it('returns empty array when input string is', () => {
    expect(splitFirst('', '|')).toEqual([]);
  });

  it('handles empty parts correctly', () => {
    expect(splitFirst(',world', ',')).toEqual(['', 'world']);
    expect(splitFirst('hello,', ',')).toEqual(['hello']);
  });

  it('handles strings containing only the divider', () => {
    expect(splitFirst(',', ',')).toEqual(['']);
  });
}); 