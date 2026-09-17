module.exports = function (api) {
  api.cache(true);
  return {
    // O Metro resolve os aliases pelos paths do tsconfig, então o
    // babel-plugin-module-resolver do projeto anterior não é necessário.
    // Este arquivo existe para o babel-jest, que precisa de configuração
    // própria para converter dependências ESM-only do msw para CommonJS.
    presets: ['babel-preset-expo'],
  };
};
