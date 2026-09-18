import type { SavedRepo } from '@/domain/entities/SavedRepo';

export type CollectionId = 'ai-ml' | 'mobile' | 'web' | 'backend' | 'tools';

/**
 * Sinais que um repositório expõe para ser categorizado.
 *
 * Tipo próprio (e não `SavedRepo`) porque a regra não depende de nada que
 * identifique o repo — só do que ele diz sobre si. Isso mantém a função pura e
 * testável sem montar uma entidade inteira.
 */
export interface CategorizationInput {
  topics: readonly string[];
  name: string;
  ownerLogin: string;
  description: string | null;
  language: string | null;
}

export interface CollectionRule {
  collection: CollectionId;
  /**
   * Termos procurados em topics, nome, owner e descrição. Comparados já
   * normalizados (minúsculas, sem separadores), então `machine-learning`
   * também casa com `machine_learning` e `Machine Learning`.
   */
  match: readonly string[];
  /**
   * Linguagens que caem nesta coleção quando nada mais casa. Última prioridade:
   * linguagem sozinha diz pouco — Rust serve tanto para backend quanto para
   * ferramenta de IA.
   */
  languages: readonly string[];
}

/**
 * ▲ ESTE É O ÚNICO LUGAR PARA EDITAR A CATEGORIZAÇÃO ▲
 *
 * A ordem do array é a prioridade: quando um repositório casa em mais de uma
 * coleção, vence a que aparece primeiro. Por isso AI & ML vem antes de Backend
 * — `openai/codex` é Rust, mas o owner `openai` deve mandar.
 *
 * Para ajustar: acrescente termos em `match` (o que aparece em topic, nome,
 * owner ou descrição) ou em `languages` (o fallback). Para mudar a precedência,
 * mova o bloco inteiro de posição.
 */
export const COLLECTION_RULES: readonly CollectionRule[] = [
  {
    collection: 'ai-ml',
    match: [
      'ai',
      'llm',
      'ml',
      'machinelearning',
      'deeplearning',
      'neuralnetwork',
      'openai',
      'anthropic',
      'huggingface',
      'pytorch',
      'tensorflow',
      'langchain',
      'transformers',
      'diffusion',
      'rag',
      'agent',
    ],
    languages: ['jupyter notebook'],
  },
  {
    collection: 'mobile',
    match: [
      'reactnative',
      'expo',
      'android',
      'ios',
      'flutter',
      'swiftui',
      'jetpackcompose',
      'mobile',
    ],
    languages: ['swift', 'kotlin', 'dart', 'objective-c'],
  },
  {
    collection: 'web',
    match: [
      'react',
      'next',
      'nextjs',
      'vue',
      'nuxt',
      'svelte',
      'sveltekit',
      'angular',
      'remix',
      'astro',
      'tailwind',
      'tailwindcss',
      'vite',
      'webpack',
      'frontend',
      'css',
      'browser',
    ],
    languages: ['html', 'css', 'scss', 'vue', 'svelte'],
  },
  {
    collection: 'backend',
    match: [
      'node',
      'nodejs',
      'nestjs',
      'express',
      'fastify',
      'deno',
      'bun',
      'go',
      'golang',
      'java',
      'spring',
      'django',
      'flask',
      'rails',
      'laravel',
      'api',
      'rest',
      'graphql',
      'grpc',
      'postgres',
      'postgresql',
      'mysql',
      'redis',
      'mongodb',
      'database',
      'server',
      'backend',
      'microservice',
    ],
    languages: [
      'go',
      'rust',
      'ruby',
      'php',
      'java',
      'c#',
      'elixir',
      'python',
      'scala',
      'clojure',
      'erlang',
    ],
  },
  {
    collection: 'tools',
    match: [
      'cli',
      'devtools',
      'tooling',
      'vscode',
      'eslint',
      'prettier',
      'githubaction',
      'githubactions',
      'template',
      'boilerplate',
      'starter',
      'generator',
      'linter',
      'formatter',
      'bundler',
      'devops',
      'docker',
      'kubernetes',
    ],
    languages: ['shell', 'makefile', 'dockerfile', 'lua', 'vim script'],
  },
];

/**
 * Reduz um termo ao seu núcleo alfanumérico minúsculo: `Machine-Learning`,
 * `machine_learning` e `Machine Learning` viram todos `machinelearning`.
 */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9#+]/g, '');
}

/**
 * Quebra um texto livre (nome, descrição) em palavras normalizadas, para casar
 * termo a termo em vez de por substring — senão `ai` casaria dentro de
 * "cont**ai**ner" e jogaria meio mundo em AI & ML.
 */
function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9#+]+/)
    .filter((token) => token.length > 0);
}

function collectTokens(input: CategorizationInput): Set<string> {
  const tokens = new Set<string>();

  // Topics vêm da própria taxonomia do GitHub: são o sinal mais confiável e
  // entram inteiros (`machine-learning` → `machinelearning`) e quebrados.
  for (const topic of input.topics) {
    tokens.add(normalize(topic));
    for (const token of tokenize(topic)) tokens.add(token);
  }

  for (const token of tokenize(input.name)) tokens.add(token);
  tokens.add(normalize(input.name));

  for (const token of tokenize(input.ownerLogin)) tokens.add(token);
  tokens.add(normalize(input.ownerLogin));

  if (input.description !== null) {
    for (const token of tokenize(input.description)) tokens.add(token);
  }

  return tokens;
}

/**
 * Decide a coleção de um repositório. Um repo pertence a no máximo UMA coleção:
 * a de maior prioridade entre as que casam.
 *
 * Prioridade, do mais forte para o mais fraco:
 *   1. topics do repositório
 *   2. palavras em nome, owner e descrição
 *   3. linguagem, como último recurso
 *
 * Os dois primeiros níveis são avaliados juntos contra `match`, percorrendo as
 * regras na ordem de `COLLECTION_RULES`. Só quando nenhum termo casa é que a
 * linguagem entra — de novo na ordem das regras.
 *
 * Nada casou → `null`: o repositório fica sem coleção, mas continua visível em
 * "Todos" e em "Salvos recentemente".
 */
export function categorizeRepo(input: CategorizationInput): CollectionId | null {
  const tokens = collectTokens(input);

  for (const rule of COLLECTION_RULES) {
    if (rule.match.some((term) => tokens.has(term))) {
      return rule.collection;
    }
  }

  if (input.language !== null) {
    const language = input.language.toLowerCase();
    for (const rule of COLLECTION_RULES) {
      if (rule.languages.includes(language)) {
        return rule.collection;
      }
    }
  }

  return null;
}

export function categorizeSavedRepo(repo: SavedRepo): CollectionId | null {
  return categorizeRepo({
    topics: repo.topics,
    name: repo.name,
    ownerLogin: repo.ownerLogin,
    description: repo.description,
    language: repo.language,
  });
}
