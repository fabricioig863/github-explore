import type { ContributionDay, ContributionLevel } from '@/domain/entities/ContributionDay';

const WEEKS = 20;
const DAYS_PER_WEEK = 7;
const TOTAL_CELLS = WEEKS * DAYS_PER_WEEK; // 140
const DAY_MS = 86_400_000;

const BASE_DATE_MS = Date.parse('2025-06-01T00:00:00Z');

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0 || 1;
}

function levelFrom(r: number): ContributionLevel {
  if (r < 0.5) return 0;
  if (r < 0.72) return 1;
  if (r < 0.87) return 2;
  if (r < 0.96) return 3;
  return 4;
}

export function generatePlaceholderContributions(seed: string): ContributionDay[] {
  let state = hashSeed(seed);
  const rand = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };

  const days: ContributionDay[] = [];
  for (let i = 0; i < TOTAL_CELLS; i += 1) {
    const level = levelFrom(rand());
    const count = level === 0 ? 0 : level * 3 + Math.floor(rand() * 4);
    days.push({ date: new Date(BASE_DATE_MS + i * DAY_MS), count, level });
  }
  return days;
}

export function totalContributions(days: ContributionDay[]): number {
  return days.reduce((sum, day) => sum + day.count, 0);
}
