import { formatMeasure } from '../formatMeasure';

describe('formatMeasure', () => {
  it.each([
    ['1 1/2 oz ', '1½ oz'],
    ['1/2 oz', '½ oz'],
    ['3/4 cup', '¾ cup'],
    ['10 1/2 oz', '10½ oz'],
    ['Juice of 1/2', 'Juice of ½'],
    ['2 oz', '2 oz'],
    ['1-2 dash', '1-2 dash'],
    ['Top up', 'Top up'],
  ])('%j → %j', (input, expected) => {
    expect(formatMeasure(input)).toBe(expected);
  });

  it('leaves fractions without a glyph alone', () => {
    expect(formatMeasure('1 2/5 oz')).toBe('1 2/5 oz');
  });
});
