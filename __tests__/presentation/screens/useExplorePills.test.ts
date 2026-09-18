import { act, renderHook } from '@testing-library/react-native';

import { useExplorePills } from '@/presentation/screens/SearchScreen/hooks/useExplorePills';

describe('useExplorePills', () => {
  it('starts with Trending selected and its query', () => {
    const { result } = renderHook(() => useExplorePills());

    expect(result.current.selectedId).toBe('trending');
    expect(result.current.query).toBe('stars:>10000');
  });

  it('exposes the five pills in the designed order', () => {
    const { result } = renderHook(() => useExplorePills());

    expect(result.current.pills.map((p) => p.id)).toEqual([
      'trending',
      'mobile',
      'ts',
      'rust',
      'ai',
    ]);
  });

  it('select changes the id and the query follows the selected pill', () => {
    const { result } = renderHook(() => useExplorePills());

    act(() => result.current.select('rust'));

    expect(result.current.selectedId).toBe('rust');
    expect(result.current.query).toBe('language:rust');
  });

  it('returns an empty query when the selected id does not exist', () => {
    const { result } = renderHook(() => useExplorePills());

    act(() => result.current.select('inexistente'));

    expect(result.current.query).toBe('');
  });
});
