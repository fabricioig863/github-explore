import {
  generatePlaceholderContributions,
  totalContributions,
} from '@/presentation/utils/contributions';

describe('contributions placeholder', () => {
  it('gera 140 células com níveis 0..4 e datas', () => {
    const days = generatePlaceholderContributions('octocat');

    expect(days).toHaveLength(140);
    for (const day of days) {
      expect(day.level).toBeGreaterThanOrEqual(0);
      expect(day.level).toBeLessThanOrEqual(4);
      expect(day.count).toBeGreaterThanOrEqual(0);
      expect(day.date).toBeInstanceOf(Date);
    }
  });

  it('é determinístico para a mesma seed', () => {
    const a = generatePlaceholderContributions('octocat');
    const b = generatePlaceholderContributions('octocat');

    expect(a.map((d) => d.level)).toEqual(b.map((d) => d.level));
  });

  it('seeds diferentes produzem séries diferentes', () => {
    const a = generatePlaceholderContributions('octocat').map((d) => d.level);
    const b = generatePlaceholderContributions('torvalds').map((d) => d.level);

    expect(a).not.toEqual(b);
  });

  it('totalContributions soma as contagens', () => {
    const days = generatePlaceholderContributions('x');
    const manual = days.reduce((s, d) => s + d.count, 0);

    expect(totalContributions(days)).toBe(manual);
  });
});
