import { useEffect, useRef } from 'react';

import type { AnalyticsEvent, ScreenName } from '@/domain/observability/AnalyticsEvent';
import type { IAnalytics } from '@/domain/observability/IAnalytics';
import { container } from 'src/infra/di/bootstrap';

export function useAnalytics(): IAnalytics {
  return container.analytics;
}

export function useTrackScreen(screen: ScreenName): void {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.trackScreen(screen);
  }, [analytics, screen]);
}

export function useTrackEvent(event: AnalyticsEvent | null): void {
  const analytics = useAnalytics();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (event === null) return;

    const key = JSON.stringify(event);
    if (lastKey.current === key) return;

    lastKey.current = key;
    analytics.track(event);
  }, [analytics, event]);
}
