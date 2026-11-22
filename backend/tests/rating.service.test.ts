import { describe, it, expect } from 'vitest';
import { calculateElo } from '../src/services/rating.service';

describe('calculateElo', () => {
  it('gives +16 to the winner when both ratings are equal', () => {
    expect(calculateElo(1000, 1000, 'win')).toEqual({ ratingBefore: 1000, newRating: 1016 });
  });

  it('gives -16 to the loser when both ratings are equal', () => {
    expect(calculateElo(1000, 1000, 'loss').newRating).toBe(984);
  });

  it('does not change equal ratings on a draw', () => {
    expect(calculateElo(1200, 1200, 'draw').newRating).toBe(1200);
  });

  it('gives more points for beating a stronger opponent (upset)', () => {
    const upset = calculateElo(1000, 1400, 'win').newRating - 1000;
    const expected = calculateElo(1400, 1000, 'win').newRating - 1400;
    expect(upset).toBeGreaterThan(expected);
    expect(upset).toBe(29);
  });

  it('lowers the stronger boxer slightly on a draw', () => {
    expect(calculateElo(1400, 1000, 'draw').newRating).toBe(1387);
    expect(calculateElo(1000, 1400, 'draw').newRating).toBe(1013);
  });

  it('never changes a rating by more than K = 32', () => {
    expect(calculateElo(800, 2000, 'win').newRating - 800).toBeLessThanOrEqual(32);
    expect(2000 - calculateElo(2000, 800, 'loss').newRating).toBeLessThanOrEqual(32);
  });

  it('the winner gains exactly as many points as the loser loses', () => {
    const gain = calculateElo(1100, 1250, 'win').newRating - 1100;
    const loss = 1250 - calculateElo(1250, 1100, 'loss').newRating;
    expect(gain).toBe(loss + 1);
  });
});
