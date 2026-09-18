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
    '^src/(.*)$': '<rootDir>/src/$1',
    // msw@2 publica builds condicionais via package.json#exports. O jest-expo
    // ativa a condição 'react-native', que mapeia `msw/node` para null e bloqueia
    // o módulo. Apontamos direto para o bundle CJS já compilado.
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
  },
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
  // O msw depende transitivamente de pacotes ESM-only. O jest-expo libera
  // transform sob `.pnpm/` na raiz, mas seu regex volta a ignorar arquivos sob o
  // segundo node_modules aninhado. A lista abaixo é explícita por isso.
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|lucide-react-native|react-navigation|@react-navigation|native-base|msw|@mswjs|@bundled-es-modules|@open-draft|until-async|headers-polyfill|cookie|tough-cookie|outvariant|rettime|strict-event-emitter|graphql|statuses|is-node-process|path-to-regexp|set-cookie-parser|type-fest|standard-navigation))',
  ],
};
