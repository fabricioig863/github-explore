import { ThemeProvider } from '@shopify/restyle';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { DesignSystemScreen } from '@/presentation/screens/DesignSystemScreen/DesignSystemScreen';
import { darkTheme } from 'src/infra/theme/darkTheme';
import { lightTheme, type Theme } from 'src/infra/theme/lightTheme';

jest.mock('src/infra/theme/AppThemeProvider', () => ({
  useThemeMode: () => ({
    mode: 'light',
    resolvedScheme: 'light',
    setMode: jest.fn(),
    isHydrated: true,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

function renderWithTheme(ui: ReactElement, theme: Theme) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('DesignSystemScreen', () => {
  it('renderiza todas as seções no tema claro', () => {
    const { getByText } = renderWithTheme(<DesignSystemScreen />, lightTheme);

    expect(getByText('Design System')).toBeTruthy();
    expect(getByText('Botões')).toBeTruthy();
    expect(getByText('Inputs')).toBeTruthy();
    expect(getByText('Badges')).toBeTruthy();
    expect(getByText('Card · Avatar')).toBeTruthy();
    expect(getByText('Cores')).toBeTruthy();
    expect(getByText('Tipografia')).toBeTruthy();
    expect(getByText('Display')).toBeTruthy();
  });

  it('renderiza no tema escuro sem quebrar', () => {
    const { getByText } = renderWithTheme(<DesignSystemScreen />, darkTheme);

    expect(getByText('Botões')).toBeTruthy();
    expect(getByText('Cores')).toBeTruthy();
  });
});
