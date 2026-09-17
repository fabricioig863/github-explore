import { act, renderHook } from '@testing-library/react-native';

import { useExplorePills } from '@/presentation/screens/SearchScreen/hooks/useExplorePills';

describe('useExplorePills', () => {
  it('inicia com Trending selecionada e sua query', () => {
    const { result } = renderHook(() => useExplorePills());

    expect(result.current.selectedId).toBe('trending');
    expect(result.current.query).toBe('stars:>10000');
  });

  it('expõe as 5 pills na ordem do mockup', () => {
    const { result } = renderHook(() => useExplorePills());

    expect(result.current.pills.map((p) => p.id)).toEqual(['trending', 'mobile', 'ts', 'rust', 'ai']);
  });

  it('select troca o id e a query reflete a pill selecionada', () => {
    const { result } = renderHook(() => useExplorePills());

    act(() => result.current.select('rust'));

    expect(result.current.selectedId).toBe('rust');
    expect(result.current.query).toBe('language:rust');
  });

  it('query vazia quando o id selecionado não existe', () => {
    const { result } = renderHook(() => useExplorePills());

    act(() => result.current.select('inexistente'));

    expect(result.current.query).toBe('');
  });
});
