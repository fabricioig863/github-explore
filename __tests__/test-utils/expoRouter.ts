// Mock compartilhado do expo-router. As telas leem navegação e parâmetros de
// rota por hooks, então o teste controla os dois por aqui em vez de injetar
// props. Os objetos são estáveis entre renders, o que mantém válidas as
// dependências de useCallback e useLayoutEffect nas telas.
export const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
};

export const navigationMock = {
  setOptions: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(() => () => {}),
};

let params: Record<string, string> = {};

export const getSearchParams = (): Record<string, string> => params;

export const setSearchParams = (next: Record<string, string>): void => {
  params = next;
};

export const resetExpoRouterMock = (): void => {
  Object.values(routerMock).forEach((fn) => fn.mockReset());
  navigationMock.setOptions.mockReset();
  navigationMock.goBack.mockReset();
  navigationMock.setParams.mockReset();
  params = {};
};
