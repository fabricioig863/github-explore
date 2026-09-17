export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: Date;
  count: number;
  level: ContributionLevel;
}
