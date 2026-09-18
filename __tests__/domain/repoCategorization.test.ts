import {
  COLLECTION_RULES,
  categorizeRepo,
  type CategorizationInput,
} from '@/domain/services/repoCategorization';

function input(overrides: Partial<CategorizationInput> = {}): CategorizationInput {
  return {
    topics: [],
    name: 'repo',
    ownerLogin: 'owner',
    description: null,
    language: null,
    ...overrides,
  };
}

describe('categorizeRepo', () => {
  describe('casos relatados pelo usuário', () => {
    it('JavaScript/Node vai para Backend', () => {
      expect(
        categorizeRepo(input({ name: 'node', ownerLogin: 'nodejs', language: 'JavaScript' })),
      ).toBe('backend');
    });

    it('React vai para Web', () => {
      expect(
        categorizeRepo(input({ name: 'react', ownerLogin: 'facebook', language: 'JavaScript' })),
      ).toBe('web');
    });

    it('openai/codex vai para AI & ML pelo owner, não para Backend pelo Rust', () => {
      expect(categorizeRepo(input({ name: 'codex', ownerLogin: 'openai', language: 'Rust' }))).toBe(
        'ai-ml',
      );
    });

    it('sem nenhum match cai no fallback: nenhuma coleção', () => {
      expect(
        categorizeRepo(input({ name: 'coisa', ownerLogin: 'alguem', language: 'Brainfuck' })),
      ).toBeNull();
    });
  });

  describe('prioridade 1: topics', () => {
    it('topic vence a linguagem', () => {
      expect(categorizeRepo(input({ topics: ['machine-learning'], language: 'Go' }))).toBe('ai-ml');
    });

    it('normaliza separadores do topic', () => {
      expect(categorizeRepo(input({ topics: ['Machine_Learning'] }))).toBe('ai-ml');
      expect(categorizeRepo(input({ topics: ['react-native'] }))).toBe('mobile');
    });
  });

  describe('prioridade 2: nome, owner e descrição', () => {
    it('casa por palavra na descrição', () => {
      expect(categorizeRepo(input({ description: 'A tiny CLI for logs' }))).toBe('tools');
    });

    it('casa por owner', () => {
      expect(categorizeRepo(input({ ownerLogin: 'anthropic' }))).toBe('ai-ml');
    });

    it('não casa por substring: "container" não vira AI pelo "ai"', () => {
      expect(categorizeRepo(input({ description: 'a container runtime' }))).toBeNull();
    });
  });

  describe('prioridade 3: linguagem como fallback', () => {
    it('usa a linguagem quando nada mais casa', () => {
      expect(categorizeRepo(input({ language: 'Swift' }))).toBe('mobile');
      expect(categorizeRepo(input({ language: 'Go' }))).toBe('backend');
      expect(categorizeRepo(input({ language: 'Jupyter Notebook' }))).toBe('ai-ml');
    });

    it('ignora caixa da linguagem', () => {
      expect(categorizeRepo(input({ language: 'SWIFT' }))).toBe('mobile');
    });

    it('sem linguagem e sem match devolve null', () => {
      expect(categorizeRepo(input())).toBeNull();
    });
  });

  describe('um repo pertence a no máximo uma coleção', () => {
    it('resolve empate pela ordem de COLLECTION_RULES', () => {
      // Casa em Web (react) e em Mobile (react-native). Mobile vem antes.
      expect(categorizeRepo(input({ topics: ['react', 'react-native'] }))).toBe('mobile');
    });

    it('AI & ML tem a maior prioridade', () => {
      expect(COLLECTION_RULES[0]?.collection).toBe('ai-ml');
    });
  });

  describe('as cinco coleções são alcançáveis', () => {
    it.each([
      ['ai-ml', input({ topics: ['llm'] })],
      ['mobile', input({ topics: ['flutter'] })],
      ['web', input({ topics: ['nextjs'] })],
      ['backend', input({ topics: ['postgres'] })],
      ['tools', input({ topics: ['eslint'] })],
    ])('%s recebe repositórios', (expected, repo) => {
      expect(categorizeRepo(repo)).toBe(expected);
    });
  });
});
