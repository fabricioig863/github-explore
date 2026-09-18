import type { AnalyticsEvent, ScreenName } from '@/domain/observability/AnalyticsEvent';
import type { IAnalytics } from '@/domain/observability/IAnalytics';
import type { CrashContext, ICrashReporter } from '@/domain/observability/ICrashReporter';

export class NoopAnalytics implements IAnalytics {
  track(_event: AnalyticsEvent): void {}
  trackScreen(_screen: ScreenName): void {}
}

export class NoopCrashReporter implements ICrashReporter {
  recordError(_error: Error, _context?: CrashContext): void {}
  log(_message: string): void {}
}
