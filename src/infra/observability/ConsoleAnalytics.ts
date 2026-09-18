import type { AnalyticsEvent, ScreenName } from '@/domain/observability/AnalyticsEvent';
import type { IAnalytics } from '@/domain/observability/IAnalytics';
import type { CrashContext, ICrashReporter } from '@/domain/observability/ICrashReporter';

export class ConsoleAnalytics implements IAnalytics {
  track(event: AnalyticsEvent): void {
    const { name, ...params } = event;
    console.log(`[analytics] ${name}`, params);
  }

  trackScreen(screen: ScreenName): void {
    console.log(`[analytics] screen_view`, { screen });
  }
}

export class ConsoleCrashReporter implements ICrashReporter {
  recordError(error: Error, context?: CrashContext): void {
    console.error(`[crash] ${error.name}: ${error.message}`, context ?? {});
  }

  log(message: string): void {
    console.log(`[crash:log] ${message}`);
  }
}
