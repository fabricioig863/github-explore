import { ConsoleAnalytics, ConsoleCrashReporter } from 'src/infra/observability/ConsoleAnalytics';
import { NoopAnalytics, NoopCrashReporter } from 'src/infra/observability/NoopAnalytics';

describe('observability adapters', () => {
  describe('Noop', () => {
    it('does nothing and does not throw', () => {
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

    it('logs the event name apart from its parameters', () => {
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

    it('logs the visited screen', () => {
      new ConsoleAnalytics().trackScreen('profile');

      expect(logSpy).toHaveBeenCalledWith('[analytics] screen_view', { screen: 'profile' });
    });

    it('reports the error with name, message and context', () => {
      new ConsoleCrashReporter().recordError(new TypeError('quebrou'), { source: 'query' });

      expect(errorSpy).toHaveBeenCalledWith('[crash] TypeError: quebrou', { source: 'query' });
    });

    it('uses an empty context when none is given', () => {
      new ConsoleCrashReporter().recordError(new Error('sem contexto'));

      expect(errorSpy).toHaveBeenCalledWith('[crash] Error: sem contexto', {});
    });

    it('logs standalone messages', () => {
      new ConsoleCrashReporter().log('passou aqui');

      expect(logSpy).toHaveBeenCalledWith('[crash:log] passou aqui');
    });
  });
});
