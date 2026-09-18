import { renderHook, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { useRemoveAvatar } from '@/presentation/hooks/useRemoveAvatar';
import { useUpdateAvatar } from '@/presentation/hooks/useUpdateAvatar';
import { queryKeys } from '@/presentation/query/queryKeys';
import { container } from 'src/infra/di/bootstrap';

import { createTestQueryClient } from '../../test-utils/renderWithProviders';

jest.mock('src/infra/di/bootstrap', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory is hoisted
  container: require('../../test-utils/fakes/makeFakeContainer').makeFakeContainer(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const updatePrefs = container.updateUserPreferencesUseCase.execute as jest.Mock;
const requestPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const launchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

function makeWrapper() {
  const client = createTestQueryClient();
  const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- keeps the wrapper free of JSX in a .ts file
  const { QueryClientProvider } = require('@tanstack/react-query');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- same reason
  const { createElement } = require('react');
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

  return { Wrapper, invalidateSpy };
}

function grantPermission() {
  requestPermission.mockResolvedValue({ granted: true });
}

function pickImage(uri: string) {
  launchLibrary.mockResolvedValue({ canceled: false, assets: [{ uri }] });
}

describe('useUpdateAvatar', () => {
  beforeEach(() => {
    updatePrefs.mockReset().mockResolvedValue({ localAvatarUri: 'file:///picked.jpg' });
    requestPermission.mockReset();
    launchLibrary.mockReset();
  });

  it('stores the picked image as the local avatar', async () => {
    grantPermission();
    pickImage('file:///picked.jpg');
    const { Wrapper } = makeWrapper();

    const { result } = renderHook(() => useUpdateAvatar(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => {
      expect(updatePrefs).toHaveBeenCalledWith({ localAvatarUri: 'file:///picked.jpg' });
    });
  });

  it('refreshes the preferences query after storing', async () => {
    grantPermission();
    pickImage('file:///picked.jpg');
    const { Wrapper, invalidateSpy } = makeWrapper();

    const { result } = renderHook(() => useUpdateAvatar(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.prefs.user() });
    });
  });

  it('does nothing when the media library permission is denied', async () => {
    requestPermission.mockResolvedValue({ granted: false });
    const { Wrapper } = makeWrapper();

    const { result } = renderHook(() => useUpdateAvatar(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(launchLibrary).not.toHaveBeenCalled();
    expect(updatePrefs).not.toHaveBeenCalled();
  });

  it('does nothing when the user cancels the picker', async () => {
    grantPermission();
    launchLibrary.mockResolvedValue({ canceled: true, assets: null });
    const { Wrapper } = makeWrapper();

    const { result } = renderHook(() => useUpdateAvatar(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(updatePrefs).not.toHaveBeenCalled();
  });

  it('does nothing when the picker returns no asset', async () => {
    grantPermission();
    launchLibrary.mockResolvedValue({ canceled: false, assets: [] });
    const { Wrapper } = makeWrapper();

    const { result } = renderHook(() => useUpdateAvatar(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(updatePrefs).not.toHaveBeenCalled();
  });

  it('leaves the cache untouched when nothing was picked', async () => {
    requestPermission.mockResolvedValue({ granted: false });
    const { Wrapper, invalidateSpy } = makeWrapper();

    const { result } = renderHook(() => useUpdateAvatar(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('asks for permission before opening the library', async () => {
    grantPermission();
    pickImage('file:///picked.jpg');
    const { Wrapper } = makeWrapper();

    const { result } = renderHook(() => useUpdateAvatar(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => {
      expect(updatePrefs).toHaveBeenCalled();
    });
    expect(requestPermission.mock.invocationCallOrder[0]).toBeLessThan(
      launchLibrary.mock.invocationCallOrder[0] as number,
    );
  });
});

describe('useRemoveAvatar', () => {
  beforeEach(() => {
    updatePrefs.mockReset().mockResolvedValue({ localAvatarUri: null });
  });

  it('clears the local avatar', async () => {
    const { Wrapper } = makeWrapper();

    const { result } = renderHook(() => useRemoveAvatar(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => {
      expect(updatePrefs).toHaveBeenCalledWith({ localAvatarUri: null });
    });
  });

  it('refreshes the preferences query after clearing', async () => {
    const { Wrapper, invalidateSpy } = makeWrapper();

    const { result } = renderHook(() => useRemoveAvatar(), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.prefs.user() });
    });
  });
});
