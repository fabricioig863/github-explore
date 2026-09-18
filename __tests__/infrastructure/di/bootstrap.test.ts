import { container } from 'src/infra/di/bootstrap';

describe('di/bootstrap', () => {
  it('exposes a container already composed with the use cases', () => {
    expect(typeof container.searchReposUseCase.execute).toBe('function');
    expect(typeof container.getRepoDetailsUseCase.execute).toBe('function');
    expect(typeof container.listIssuesUseCase.execute).toBe('function');
    expect(typeof container.countIssuesUseCase.execute).toBe('function');
    expect(typeof container.listSavedReposUseCase.execute).toBe('function');
    expect(typeof container.saveRepoUseCase.execute).toBe('function');
    expect(typeof container.unsaveRepoUseCase.execute).toBe('function');
    expect(typeof container.isRepoSavedUseCase.execute).toBe('function');
  });

  it('the container is a stable singleton across imports', () => {
    const again = require('src/infra/di/bootstrap');
    expect(again.container).toBe(container);
  });
});
