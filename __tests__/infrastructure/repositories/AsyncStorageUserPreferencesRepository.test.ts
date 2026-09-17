import AsyncStorage from '@react-native-async-storage/async-storage';

import { AsyncStorageUserPreferencesRepository } from 'src/infra/repositories/AsyncStorageUserPreferencesRepository';

const KEY = '@github-explorer:user-prefs:v1';

describe('AsyncStorageUserPreferencesRepository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('get devolve o default quando não há nada persistido', async () => {
    const repo = new AsyncStorageUserPreferencesRepository();
    expect(await repo.get()).toEqual({ localAvatarUri: null });
  });

  it('update persiste e get devolve o valor (merge com default)', async () => {
    const repo = new AsyncStorageUserPreferencesRepository();

    const updated = await repo.update({ localAvatarUri: 'file://a.jpg' });
    expect(updated).toEqual({ localAvatarUri: 'file://a.jpg' });
    expect(await repo.get()).toEqual({ localAvatarUri: 'file://a.jpg' });
  });

  it('update com null limpa o avatar local', async () => {
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
