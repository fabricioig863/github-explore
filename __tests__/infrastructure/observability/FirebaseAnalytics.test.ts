import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  log as crashlyticsLog,
  recordError,
  setAttributes,
} from '@react-native-firebase/crashlytics';

import {
  FirebaseAnalytics,
  FirebaseCrashReporter,
} from 'src/infra/observability/FirebaseAnalytics';

const logEventMock = logEvent as jest.Mock;
const recordErrorMock = recordError as jest.Mock;
const setAttributesMock = setAttributes as jest.Mock;
const crashlyticsLogMock = crashlyticsLog as jest.Mock;

describe('FirebaseAnalytics', () => {
  beforeEach(() => {
    logEventMock.mockClear();
  });

  it('usa o nome do evento e manda o resto como parâmetros', () => {
    new FirebaseAnalytics().track({
      name: 'repo_searched',
      query: 'react',
      resultCount: 42,
    });

    expect(logEventMock).toHaveBeenCalledWith(getAnalytics(), 'repo_searched', {
      query: 'react',
      resultCount: 42,
    });
  });

  it('converte null em "none": o Firebase descarta parâmetro nulo', () => {
    new FirebaseAnalytics().track({
      name: 'repo_saved',
      fullName: 'a/b',
      collection: null,
    });

    expect(logEventMock).toHaveBeenCalledWith(getAnalytics(), 'repo_saved', {
      fullName: 'a/b',
      collection: 'none',
    });
  });

  it('registra tela como o evento screen_view padrão do GA4', () => {
    new FirebaseAnalytics().trackScreen('profile');

    expect(logEventMock).toHaveBeenCalledWith(getAnalytics(), 'screen_view', {
      screen_name: 'profile',
      screen_class: 'profile',
    });
  });
});

describe('FirebaseCrashReporter', () => {
  beforeEach(() => {
    recordErrorMock.mockClear();
    setAttributesMock.mockClear();
    crashlyticsLogMock.mockClear();
  });

  it('registra o erro no Crashlytics', () => {
    const error = new Error('quebrou');

    new FirebaseCrashReporter().recordError(error);

    expect(recordErrorMock).toHaveBeenCalledWith(getCrashlytics(), error);
    expect(setAttributesMock).not.toHaveBeenCalled();
  });

  it('anexa o contexto como atributos, convertendo valores para string', () => {
    new FirebaseCrashReporter().recordError(new Error('x'), { source: 'query', retries: 2 });

    expect(setAttributesMock).toHaveBeenCalledWith(getCrashlytics(), {
      source: 'query',
      retries: '2',
    });
  });

  it('encaminha mensagens avulsas', () => {
    new FirebaseCrashReporter().log('passou aqui');

    expect(crashlyticsLogMock).toHaveBeenCalledWith(getCrashlytics(), 'passou aqui');
  });
});
