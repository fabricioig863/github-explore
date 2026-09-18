import { buildSearchQuery } from 'src/infra/repositories/GitHubRepoRepository';

describe('buildSearchQuery', () => {
  describe('formato repo:owner/name', () => {
    it('uses the repo: qualifier for a valid owner/repo', () => {
      expect(buildSearchQuery('openai/openai-cookbook')).toBe('repo:openai/openai-cookbook');
    });

    it('aceita owner hifenizado', () => {
      expect(buildSearchQuery('expo-cli/expo')).toBe('repo:expo-cli/expo');
    });

    it('trims before deciding the format', () => {
      expect(buildSearchQuery('  facebook/react-native  ')).toBe('repo:facebook/react-native');
    });
  });

  describe('free-form term with in:name,description', () => {
    it('appends the qualifier to a single-word term', () => {
      expect(buildSearchQuery('openai-cookbook')).toBe('openai-cookbook in:name,description');
    });

    it('appends the qualifier to a multi-word term', () => {
      expect(buildSearchQuery('react native debugger')).toBe(
        'react native debugger in:name,description',
      );
    });

    it('treats an empty string as a simple term', () => {
      expect(buildSearchQuery('')).toBe(' in:name,description');
    });

    it('treats a whitespace-only string as empty after trimming', () => {
      expect(buildSearchQuery('   ')).toBe(' in:name,description');
    });

    it('more than two segments is not a repo path', () => {
      expect(buildSearchQuery('a/b/c')).toBe('a/b/c in:name,description');
    });

    it('a trailing slash is not a repo path', () => {
      expect(buildSearchQuery('a/')).toBe('a/ in:name,description');
    });

    it('a leading slash is not a repo path', () => {
      expect(buildSearchQuery('/b')).toBe('/b in:name,description');
    });
  });
});
