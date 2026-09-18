import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useTrackEvent, useTrackScreen } from '@/presentation/hooks/useAnalytics';
import { container } from 'src/infra/di/bootstrap';

import type { FakeAnalytics } from '../../test-utils/fakes/FakeAnalytics';

jest.mock('src/infra/di/bootstrap', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- fábrica de jest.mock é hoisted
  container: require('../../test-utils/fakes/makeFakeContainer').makeFakeContainer(),
}));

const analytics = container.analytics as unknown as FakeAnalytics;

function ScreenProbe({ screen }: { screen: 'explore' | 'profile' }) {
  useTrackScreen(screen);
  return <Text>probe</Text>;
}

function EventProbe({ login }: { login: string }) {
  useTrackEvent({ name: 'profile_viewed', login });
  return <Text>probe</Text>;
}

describe('useTrackScreen', () => {
  beforeEach(() => {
    analytics.trackScreen.mockClear();
  });

  it('tracks the screen on mount', () => {
    render(<ScreenProbe screen="explore" />);

    expect(analytics.trackScreen).toHaveBeenCalledWith('explore');
  });

  it('does not track again on re-render with the same screen', () => {
    const { rerender } = render(<ScreenProbe screen="explore" />);
    rerender(<ScreenProbe screen="explore" />);

    expect(analytics.trackScreen).toHaveBeenCalledTimes(1);
  });

  it('tracks again when the screen changes', () => {
    const { rerender } = render(<ScreenProbe screen="explore" />);
    rerender(<ScreenProbe screen="profile" />);

    expect(analytics.trackScreen).toHaveBeenCalledTimes(2);
    expect(analytics.trackScreen).toHaveBeenLastCalledWith('profile');
  });
});

describe('useTrackEvent', () => {
  beforeEach(() => {
    analytics.track.mockClear();
  });

  it('emits the event on mount', () => {
    render(<EventProbe login="octocat" />);

    expect(analytics.track).toHaveBeenCalledWith({ name: 'profile_viewed', login: 'octocat' });
  });

  it('does not repeat the same event on re-render', () => {
    const { rerender } = render(<EventProbe login="octocat" />);
    rerender(<EventProbe login="octocat" />);
    rerender(<EventProbe login="octocat" />);

    expect(analytics.track).toHaveBeenCalledTimes(1);
  });

  it('emits again when the event payload changes', () => {
    const { rerender } = render(<EventProbe login="octocat" />);
    rerender(<EventProbe login="torvalds" />);

    expect(analytics.track).toHaveBeenCalledTimes(2);
    expect(analytics.track).toHaveBeenLastCalledWith({
      name: 'profile_viewed',
      login: 'torvalds',
    });
  });
});
