import type { AnalyticsEvent, ScreenName } from '@/domain/observability/AnalyticsEvent';

export interface IAnalytics {
  track(event: AnalyticsEvent): void;
  trackScreen(screen: ScreenName): void;
}
