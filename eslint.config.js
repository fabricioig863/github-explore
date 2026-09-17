const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');

module.exports = defineConfig([
  ...expoConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
      // `routes` é a composition root da navegação (expo-router): a única
      // camada autorizada a importar de todas as outras.
      'boundaries/elements': [
        { type: 'routes', pattern: 'src/app/**' },
        { type: 'domain', pattern: 'src/domain/**' },
        { type: 'application', pattern: 'src/application/**' },
        { type: 'infrastructure', pattern: 'src/infra/**' },
        { type: 'presentation', pattern: 'src/presentation/**' },
      ],
    },
    rules: {
      'no-void': ['warn', { allowAsStatement: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-cycle': 'error',

      // A regra de dependência aponta para dentro. Violação quebra o build,
      // não é apenas documentação.
      // Pureza de domain/application. Continua na regra legada de propósito:
      // em boundaries@7.2.0 a regra nova `boundaries/dependencies` não avalia
      // dependências externas — verificado com source curinga e literal, nenhuma
      // das duas dispara. `boundaries/external` funciona e é o que importa.
      // Migrar quando a regra nova passar a cobrir `module.origin: 'external'`.
      'boundaries/external': [
        'error',
        {
          default: 'allow',
          policies: [
            { from: { element: { type: 'domain' } }, disallow: ['*'] },
            { from: { element: { type: 'application' } }, disallow: ['*'] },
          ],
        },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'domain' } },
              disallow: {
                to: {
                  element: {
                    types: { anyOf: ['application', 'infrastructure', 'presentation', 'routes'] },
                  },
                },
              },
              message: 'domain é puro: não pode importar de nenhuma outra camada.',
            },
            {
              from: { element: { type: 'application' } },
              disallow: {
                to: { element: { types: { anyOf: ['infrastructure', 'presentation', 'routes'] } } },
              },
              message: 'application só pode importar de domain.',
            },
            {
              from: { element: { type: 'infrastructure' } },
              disallow: { to: { element: { types: { anyOf: ['presentation', 'routes'] } } } },
              message: 'infrastructure não pode importar de presentation nem de rotas.',
            },
            {
              from: { element: { type: 'presentation' } },
              disallow: { to: { element: { type: 'routes' } } },
              message: 'presentation não pode importar arquivos de rota.',
            },
            // Pureza: domain e application não usam nenhum pacote de terceiros,
            // nem React. Só TypeScript e o próprio domínio.
          ],
        },
      ],
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'coverage/**',
      'android/**',
      'ios/**',
      'mockups/**',
      'plugins/**',
      'scripts/**',
      'eslint.config.js',
      'jest.config.js',
      'metro.config.js',
    ],
  },
]);
