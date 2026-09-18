import {
  categorize,
  countByCollection,
  emptyCounts,
  reposInCollection,
  COLLECTIONS,
} from '@/presentation/utils/savedCollections';

import { makeSavedRepo } from '../../test-utils/fixtures/savedRepo.fixture';

function neutralRepo(overrides: Parameters<typeof makeSavedRepo>[0]) {
  return makeSavedRepo({
    fullName: 'alguem/coisa',
    name: 'coisa',
    ownerLogin: 'alguem',
    ...overrides,
  });
}

describe('savedCollections', () => {
  describe('categorize', () => {
    it('delegates to the domain, using name and owner rather than only the language', () => {
      expect(categorize(makeSavedRepo({ language: null }))).toBe('mobile');
      expect(categorize(neutralRepo({ language: null }))).toBeNull();
    });

    it('falls back to the language when name and owner say nothing', () => {
      expect(categorize(neutralRepo({ language: 'Swift' }))).toBe('mobile');
      expect(categorize(neutralRepo({ language: 'Go' }))).toBe('backend');
    });
  });

  describe('countByCollection', () => {
    it('zeroes every collection when there are no repositories', () => {
      expect(countByCollection([])).toEqual(emptyCounts());
      expect(Object.keys(emptyCounts()).sort()).toEqual(
        ['ai-ml', 'backend', 'mobile', 'tools', 'web'].sort(),
      );
    });

    it('counts each repository in its collection and ignores uncategorized ones', () => {
      const repos = [
        neutralRepo({ id: 1, language: 'Swift' }),
        neutralRepo({ id: 2, language: 'Kotlin' }),
        neutralRepo({ id: 3, language: 'Go' }),
        neutralRepo({ id: 4, language: 'Shell' }),
        neutralRepo({ id: 5, language: 'Jupyter Notebook' }),
        neutralRepo({ id: 6, topics: ['nextjs'] }),
        neutralRepo({ id: 7, language: 'Brainfuck' }),
      ];
      expect(countByCollection(repos)).toEqual({
        mobile: 2,
        backend: 1,
        web: 1,
        tools: 1,
        'ai-ml': 1,
      });
    });
  });

  describe('reposInCollection', () => {
    it('filters by collection id', () => {
      const repos = [
        neutralRepo({ id: 1, language: 'Swift' }),
        neutralRepo({ id: 2, language: 'Go' }),
        neutralRepo({ id: 3, topics: ['react'] }),
      ];
      expect(reposInCollection(repos, 'mobile').map((r) => r.id)).toEqual([1]);
      expect(reposInCollection(repos, 'backend').map((r) => r.id)).toEqual([2]);
      expect(reposInCollection(repos, 'web').map((r) => r.id)).toEqual([3]);
      expect(reposInCollection(repos, 'tools')).toEqual([]);
    });
  });

  describe('COLLECTIONS metadata', () => {
    it('exposes the five collections in display order', () => {
      expect(COLLECTIONS.map((c) => c.id)).toEqual(['mobile', 'backend', 'web', 'tools', 'ai-ml']);
    });

    it('every collection has its appearance filled in', () => {
      for (const collection of COLLECTIONS) {
        expect(collection.title.length).toBeGreaterThan(0);
        expect(collection.iconColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(collection.glyph.length).toBeGreaterThan(0);
      }
    });
  });
});
