module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/test-utils/jest.setup.ts'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
  ],
  // test-utils/ não precisa de ignore explícito: o testMatch só captura
  // *.test.ts(x), então fakes, fixtures e helpers não viram suites. Ignorar o
  // diretório inteiro bloquearia meta-testes legítimos (ex.: o isolamento de
  // QueryClient em renderWithProviders.test.tsx).
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'src/domain/**/*.{ts,tsx}',
    'src/application/**/*.{ts,tsx}',
    'src/infra/**/*.{ts,tsx}',
    'src/presentation/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
    '!src/infra/repositories/InMemory*.ts',
    '!src/infra/repositories/fixtures/**',
    '!src/infra/theme/**',
    '!src/presentation/design-system/**',
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 75, functions: 80, lines: 80 },
    './src/domain/': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/application/': { statements: 100, branches: 95, functions: 100, lines: 100 },
  },
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__tests__/test-utils/svgMock.tsx',
    '^@/domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@/application/(.*)$': '<rootDir>/src/application/$1',
    '^@/infrastructure/(.*)$': '<rootDir>/src/infra/$1',
    '^@/presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
