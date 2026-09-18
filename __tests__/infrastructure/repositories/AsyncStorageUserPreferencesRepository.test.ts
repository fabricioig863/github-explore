import AsyncStorage from '@react-native-async-storage/async-storage';

import { AsyncStorageUserPreferencesRepository } from 'src/infra/repositories/AsyncStorageUserPreferencesRepository';

const KEY = '@github-explorer:user-prefs:v1';

describe('AsyncStorageUserPreferencesRepository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('get returns the default when nothing is persisted', async () => {
    const repo = new AsyncStorageUserPreferencesRepository();
    expect(await repo.get()).toEqual({ localAvatarUri: null });
  });

  it('update persists and get returns the merged value', async () => {
    const repo = new AsyncStorageUserPreferencesRepository();

    const updated = await repo.update({ localAvatarUri: 'file://a.jpg' });
    expect(updated).toEqual({ localAvatarUri: 'file://a.jpg' });
    expect(await repo.get()).toEqual({ localAvatarUri: 'file://a.jpg' });
  });

  it('update with null clears the local avatar', async () => {
    const repo = new AsyncStorageUserPreferencesRepository();
    await repo.update({ localAvatarUri: 'file://a.jpg' });

    await repo.update({ localAvatarUri: null });

    expect(await repo.get()).toEqual({ localAvatarUri: null });
  });

  it('tolera JSON corrompido devolvendo o default', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    const repo = new AsyncStorageUserPreferencesRepository();

    expect(await repo.get()).toEqual({ localAvatarUri: null });
  });
});
