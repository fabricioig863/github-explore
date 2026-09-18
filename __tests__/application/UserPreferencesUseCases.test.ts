import { GetUserPreferencesUseCase } from '@/application/use-cases/GetUserPreferencesUseCase';
import { UpdateUserPreferencesUseCase } from '@/application/use-cases/UpdateUserPreferencesUseCase';

import { FakeUserPreferencesRepository } from '../test-utils/fakes/FakeUserPreferencesRepository';

describe('GetUserPreferencesUseCase', () => {
  it('delegates to the repository and returns the preferences', async () => {
    const repo = new FakeUserPreferencesRepository({ get: { localAvatarUri: 'file://a.jpg' } });
    const useCase = new GetUserPreferencesUseCase(repo);

    const prefs = await useCase.execute();

    expect(repo.get).toHaveBeenCalledTimes(1);
    expect(prefs).toEqual({ localAvatarUri: 'file://a.jpg' });
  });
});

describe('UpdateUserPreferencesUseCase', () => {
  it('forwards the patch and returns the result', async () => {
    const repo = new FakeUserPreferencesRepository({ update: { localAvatarUri: 'file://b.jpg' } });
    const useCase = new UpdateUserPreferencesUseCase(repo);

    const prefs = await useCase.execute({ localAvatarUri: 'file://b.jpg' });

    expect(repo.update).toHaveBeenCalledWith({ localAvatarUri: 'file://b.jpg' });
    expect(prefs).toEqual({ localAvatarUri: 'file://b.jpg' });
  });

  it('accepts a null patch to clear the local avatar', async () => {
    const repo = new FakeUserPreferencesRepository();
    const useCase = new UpdateUserPreferencesUseCase(repo);

    await useCase.execute({ localAvatarUri: null });

    expect(repo.update).toHaveBeenCalledWith({ localAvatarUri: null });
  });
});
