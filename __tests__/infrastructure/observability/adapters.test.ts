import { ConsoleAnalytics, ConsoleCrashReporter } from 'src/infra/observability/ConsoleAnalytics';
import { NoopAnalytics, NoopCrashReporter } from 'src/infra/observability/NoopAnalytics';

describe('adaptadores de observabilidade', () => {
  describe('Noop', () => {
    it('não faz nada e não quebra', () => {
      const analytics = new NoopAnalytics();
      const crash = new NoopCrashReporter();

      expect(() => {
        analytics.track({ name: 'repo_unsaved', fullName: 'a/b' });
        analytics.trackScreen('explore');
        crash.recordError(new Error('x'));
        crash.log('y');
      }).not.toThrow();
    });
  });

  describe('Console', () => {
    let logSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('loga o nome do evento separado dos parâmetros', () => {
      new ConsoleAnalytics().track({
        name: 'repo_saved',
        fullName: 'facebook/react',
        collection: 'web',
      });

      expect(logSpy).toHaveBeenCalledWith('[analytics] repo_saved', {
        fullName: 'facebook/react',
        collection: 'web',
      });
    });

    it('loga a tela visitada', () => {
      new ConsoleAnalytics().trackScreen('profile');

      expect(logSpy).toHaveBeenCalledWith('[analytics] screen_view', { screen: 'profile' });
    });

    it('reporta erro com nome, mensagem e contexto', () => {
      new ConsoleCrashReporter().recordError(new TypeError('quebrou'), { source: 'query' });

      expect(errorSpy).toHaveBeenCalledWith('[crash] TypeError: quebrou', { source: 'query' });
    });

    it('usa contexto vazio quando não informado', () => {
      new ConsoleCrashReporter().recordError(new Error('sem contexto'));

      expect(errorSpy).toHaveBeenCalledWith('[crash] Error: sem contexto', {});
    });

    it('loga mensagens avulsas', () => {
      new ConsoleCrashReporter().log('passou aqui');

      expect(logSpy).toHaveBeenCalledWith('[crash:log] passou aqui');
    });
  });
});
