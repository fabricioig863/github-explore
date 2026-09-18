import type { SavedRepo } from '@/domain/entities/SavedRepo';

export type CollectionId = 'ai-ml' | 'mobile' | 'web' | 'backend' | 'tools';

export interface CategorizationInput {
  topics: readonly string[];
  name: string;
  ownerLogin: string;
  description: string | null;
  language: string | null;
}

export interface CollectionRule {
  collection: CollectionId;

  match: readonly string[];

  languages: readonly string[];
}

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
      'web',
      'website',
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

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9#+]/g, '');
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9#+]+/)
    .filter((token) => token.length > 0);
}

function collectTokens(input: CategorizationInput): Set<string> {
  const tokens = new Set<string>();

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
