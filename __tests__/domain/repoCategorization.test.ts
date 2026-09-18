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
  describe('cases reported by the user', () => {
    it('JavaScript/Node goes to Backend', () => {
      expect(
        categorizeRepo(input({ name: 'node', ownerLogin: 'nodejs', language: 'JavaScript' })),
      ).toBe('backend');
    });

    it('React goes to Web', () => {
      expect(
        categorizeRepo(input({ name: 'react', ownerLogin: 'facebook', language: 'JavaScript' })),
      ).toBe('web');
    });

    it('openai/codex goes to AI & ML by owner, not to Backend by Rust', () => {
      expect(categorizeRepo(input({ name: 'codex', ownerLogin: 'openai', language: 'Rust' }))).toBe(
        'ai-ml',
      );
    });

    it('falls back to no collection when nothing matches', () => {
      expect(
        categorizeRepo(input({ name: 'coisa', ownerLogin: 'alguem', language: 'Brainfuck' })),
      ).toBeNull();
    });
  });

  describe('priority 1: topics', () => {
    it('a topic beats the language', () => {
      expect(categorizeRepo(input({ topics: ['machine-learning'], language: 'Go' }))).toBe('ai-ml');
    });

    it('normalizes topic separators', () => {
      expect(categorizeRepo(input({ topics: ['Machine_Learning'] }))).toBe('ai-ml');
      expect(categorizeRepo(input({ topics: ['react-native'] }))).toBe('mobile');
    });
  });

  describe('priority 2: name, owner and description', () => {
    it('matches a whole word in the description', () => {
      expect(categorizeRepo(input({ description: 'A tiny CLI for logs' }))).toBe('tools');
    });

    it('matches by owner', () => {
      expect(categorizeRepo(input({ ownerLogin: 'anthropic' }))).toBe('ai-ml');
    });

    it('matches a repository named after the web itself', () => {
      expect(categorizeRepo(input({ name: 'tem-web-master' }))).toBe('web');
      expect(categorizeRepo(input({ name: 'my-website' }))).toBe('web');
    });

    it('does not match "web" inside "webrtc"', () => {
      expect(categorizeRepo(input({ name: 'webrtc' }))).toBeNull();
    });

    it('does not match by substring: "container" is not AI because of "ai"', () => {
      expect(categorizeRepo(input({ description: 'a container runtime' }))).toBeNull();
    });
  });

  describe('priority 3: language as a fallback', () => {
    it('uses the language when nothing else matches', () => {
      expect(categorizeRepo(input({ language: 'Swift' }))).toBe('mobile');
      expect(categorizeRepo(input({ language: 'Go' }))).toBe('backend');
      expect(categorizeRepo(input({ language: 'Jupyter Notebook' }))).toBe('ai-ml');
    });

    it('is case-insensitive for the language', () => {
      expect(categorizeRepo(input({ language: 'SWIFT' }))).toBe('mobile');
    });

    it('returns null with no language and no match', () => {
      expect(categorizeRepo(input())).toBeNull();
    });
  });

  describe('a repository belongs to at most one collection', () => {
    it('breaks ties by the order of COLLECTION_RULES', () => {
      expect(categorizeRepo(input({ topics: ['react', 'react-native'] }))).toBe('mobile');
    });

    it('AI & ML has the highest priority', () => {
      expect(COLLECTION_RULES[0]?.collection).toBe('ai-ml');
    });
  });

  describe('all five collections are reachable', () => {
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
