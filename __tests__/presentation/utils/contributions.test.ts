import {
  generatePlaceholderContributions,
  totalContributions,
} from '@/presentation/utils/contributions';

describe('contributions placeholder', () => {
  it('generates 140 cells with levels 0 to 4 and dates', () => {
    const days = generatePlaceholderContributions('octocat');

    expect(days).toHaveLength(140);
    for (const day of days) {
      expect(day.level).toBeGreaterThanOrEqual(0);
      expect(day.level).toBeLessThanOrEqual(4);
      expect(day.count).toBeGreaterThanOrEqual(0);
      expect(day.date).toBeInstanceOf(Date);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generatePlaceholderContributions('octocat');
    const b = generatePlaceholderContributions('octocat');

    expect(a.map((d) => d.level)).toEqual(b.map((d) => d.level));
  });

  it('different seeds produce different series', () => {
    const a = generatePlaceholderContributions('octocat').map((d) => d.level);
    const b = generatePlaceholderContributions('torvalds').map((d) => d.level);

    expect(a).not.toEqual(b);
  });

  it('totalContributions sums the counts', () => {
    const days = generatePlaceholderContributions('x');
    const manual = days.reduce((s, d) => s + d.count, 0);

    expect(totalContributions(days)).toBe(manual);
  });
});
