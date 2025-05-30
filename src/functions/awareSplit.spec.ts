import awareSplit from './awareSplit';


/**
 * awareSplit TESTS
 *
 * @group unit/awareSplit
 */


describe('awareSplit', () => {

  it('operates like a regular split method when no internal string have been found', () => {
    expect(awareSplit('one|two|three|four|five', '|')).toEqual(['one', 'two', 'three', 'four', 'five']);
  });

  /* eslint-disable no-useless-escape */
  it('ignores dividers within \" blocks', () => {
    const str = 'one|two(\"three|four\")|five';

    expect(awareSplit(str, '|')).toEqual(['one', 'two("three|four")', 'five']);
  });

  it('works with multiple text blocks in the string', () => {
    const str = 'one|two("three|four")|five("six|seven")|eight';

    expect(awareSplit(str, '|')).toEqual(['one', 'two("three|four")', 'five("six|seven")', 'eight']);
  });

  it('treat last block as open if number of closures is uneven', () => {
    const str = 'one|two("three|four")|five("six|seven)';

    expect(awareSplit(str, '|')).toEqual(['one', 'two("three|four")', 'five("six|seven)']);
  });

  it('ignores blocks at the start of the string', () => {
    const str = '"one|two"(three|four)';

    expect(awareSplit(str, '|')).toEqual(['"one|two"(three', 'four)']);
  });

  it('ignores blocks at the end of the string', () => {
    const str = 'one|two"three|four"';

    expect(awareSplit(str, '|')).toEqual(['one', 'two"three|four"']);
  });

  it('makes correct splits when the divider is right before or after the inner block', () => {
    const str = 'one|"two|three"|four';

    expect(awareSplit(str, '|')).toEqual(['one', '"two|three"', 'four']);
  });

  it('is not confused by strings within string - \" \\\" ... \\\" \"', () => {
    const obj = { p: 'blah', boom: 'say: "hello" to everyone' };
    const moreObj = { b: 'foo', more: JSON.stringify(obj) };

    const moreObjStr = awareSplit(JSON.stringify(moreObj), ':');

    expect(moreObjStr).toEqual([
      '{"b"',
      '"foo","more"',
      '"{\\\"p\\\":\\\"blah\\\",\\\"boom\\\":\\\"say: \\\\\\\"hello\\\\\\\" to everyone\\\"}"}'
    ]);
  });

  it('returns string as is in a single-cell-array if divider itself is "', () => {
    const str = 'one|two("three|four")';

    expect(awareSplit(str, '"')).toEqual([str]);
  });

  // Additional tests

  it('handles empty string input', () => {
    expect(awareSplit('', '|')).toEqual(['']);
  });

  it('handles divider not found in string', () => {
    expect(awareSplit('abcdef', '|')).toEqual(['abcdef']);
  });

  it('handles escaped quotes correctly', () => {
    const str = String.raw`one|two\"three|four\"|five`;
    expect(awareSplit(str, '|')).toEqual(['one', String.raw`two\"three`, String.raw`four\"`, 'five']);
  });

  it('handles consecutive dividers and empty segments', () => {
    expect(awareSplit('one||two|||three', '|')).toEqual(['one', '', 'two', '', '', 'three']);
  });

  it('works with different divider characters', () => {
    expect(awareSplit('one,two("three,four"),five', ',')).toEqual(['one', 'two("three,four")', 'five']);
    expect(awareSplit('one two("three four") five', ' ')).toEqual(['one', 'two("three four")', 'five']);
  });

  it('treats single quotes as regular characters', () => {
    const str = "one|two('three|four')|five";
    expect(awareSplit(str, '|')).toEqual(['one', "two('three", "four')", 'five']);
  });
});
