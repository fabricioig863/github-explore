import type { AnalyticsEvent, ScreenName } from '@/domain/observability/AnalyticsEvent';
import type { IAnalytics } from '@/domain/observability/IAnalytics';
import type { CrashContext, ICrashReporter } from '@/domain/observability/ICrashReporter';

export class FakeAnalytics implements IAnalytics {
  track: jest.Mock<void, [AnalyticsEvent]> = jest.fn();
  trackScreen: jest.Mock<void, [ScreenName]> = jest.fn();

  get events(): AnalyticsEvent[] {
    return this.track.mock.calls.map(([event]) => event);
  }

  eventsNamed<T extends AnalyticsEvent['name']>(name: T): Extract<AnalyticsEvent, { name: T }>[] {
    return this.events.filter(
      (event): event is Extract<AnalyticsEvent, { name: T }> => event.name === name,
    );
  }
}

export class FakeCrashReporter implements ICrashReporter {
  recordError: jest.Mock<void, [Error, CrashContext | undefined]> = jest.fn();
  log: jest.Mock<void, [string]> = jest.fn();
}
