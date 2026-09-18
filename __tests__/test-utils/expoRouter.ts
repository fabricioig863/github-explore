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
