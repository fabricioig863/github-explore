import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  log as crashlyticsLog,
  recordError,
  setAttributes,
} from '@react-native-firebase/crashlytics';

import type { AnalyticsEvent, ScreenName } from '@/domain/observability/AnalyticsEvent';
import type { IAnalytics } from '@/domain/observability/IAnalytics';
import type { CrashContext, ICrashReporter } from '@/domain/observability/ICrashReporter';

function toParams(event: AnalyticsEvent): Record<string, string | number> {
  const { name: _name, ...rest } = event;

  return Object.fromEntries(
    Object.entries(rest).map(([key, value]) => [key, value ?? 'none']),
  ) as Record<string, string | number>;
}

export class FirebaseAnalytics implements IAnalytics {
  track(event: AnalyticsEvent): void {
    logEvent(getAnalytics(), event.name, toParams(event));
  }

  trackScreen(screen: ScreenName): void {
    logEvent(getAnalytics(), 'screen_view', {
      screen_name: screen,
      screen_class: screen,
    });
  }
}

export class FirebaseCrashReporter implements ICrashReporter {
  recordError(error: Error, context?: CrashContext): void {
    const crashlytics = getCrashlytics();

    if (context !== undefined) {
      setAttributes(
        crashlytics,
        Object.fromEntries(Object.entries(context).map(([key, value]) => [key, String(value)])),
      );
    }

    recordError(crashlytics, error);
  }

  log(message: string): void {
    crashlyticsLog(getCrashlytics(), message);
  }
}
