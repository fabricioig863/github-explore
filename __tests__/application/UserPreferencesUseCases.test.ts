import { GetUserPreferencesUseCase } from '@/application/use-cases/GetUserPreferencesUseCase';
import { UpdateUserPreferencesUseCase } from '@/application/use-cases/UpdateUserPreferencesUseCase';

import { FakeUserPreferencesRepository } from '../test-utils/fakes/FakeUserPreferencesRepository';

describe('GetUserPreferencesUseCase', () => {
  it('delega para o repo e devolve as preferências', async () => {
    const repo = new FakeUserPreferencesRepository({ get: { localAvatarUri: 'file://a.jpg' } });
    const useCase = new GetUserPreferencesUseCase(repo);

    const prefs = await useCase.execute();

    expect(repo.get).toHaveBeenCalledTimes(1);
    expect(prefs).toEqual({ localAvatarUri: 'file://a.jpg' });
  });
});

describe('UpdateUserPreferencesUseCase', () => {
  it('encaminha o patch para o repo e devolve o resultado', async () => {
    const repo = new FakeUserPreferencesRepository({ update: { localAvatarUri: 'file://b.jpg' } });
    const useCase = new UpdateUserPreferencesUseCase(repo);

    const prefs = await useCase.execute({ localAvatarUri: 'file://b.jpg' });

    expect(repo.update).toHaveBeenCalledWith({ localAvatarUri: 'file://b.jpg' });
    expect(prefs).toEqual({ localAvatarUri: 'file://b.jpg' });
  });

  it('aceita patch com null (remover avatar local)', async () => {
    const repo = new FakeUserPreferencesRepository();
    const useCase = new UpdateUserPreferencesUseCase(repo);

    await useCase.execute({ localAvatarUri: null });

    expect(repo.update).toHaveBeenCalledWith({ localAvatarUri: null });
  });
});
