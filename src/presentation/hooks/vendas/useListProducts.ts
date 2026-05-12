import { useCallback, useEffect, useState } from 'react';
import { container } from '@core/di/container';
import { ListProductsUseCase } from '@domain/usecases/vendas';
import type { Product, ProductFilter } from '@domain/entities/Product';

interface UseListProductsState {
  products: Product[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
}

/**
 * Hook de presentation · resolve UseCase via DI e expõe apenas dados+loading.
 *
 * Páginas NUNCA chamam Repository direto · sempre via hook (RECRUTAMENTO style).
 * O hook centraliza loading/error/paginação e respeita o Generic Error Boundary
 * acima na árvore (ApiBusinessError → toast/UI bloqueante).
 */
export function useListProducts(initialFilter: ProductFilter = {}, pageSize = 24) {
  const [state, setState] = useState<UseListProductsState>({
    products: [],
    loading: true,
    hasMore: false,
    error: null,
  });
  const [filter, setFilter] = useState<ProductFilter>(initialFilter);
  const [offset, setOffset] = useState(0);

  const fetchPage = useCallback(
    async (nextOffset: number, reset: boolean) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const uc = container.resolve(ListProductsUseCase);
        const result = await uc.execute({ filter, limit: pageSize, offset: nextOffset });
        setState((s) => ({
          ...s,
          products: reset ? result.itens : [...s.products, ...result.itens],
          hasMore: result.temMais,
          loading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao listar produtos';
        setState((s) => ({ ...s, loading: false, error: message }));
      }
    },
    [filter, pageSize],
  );

  useEffect(() => {
    setOffset(0);
    fetchPage(0, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (state.loading || !state.hasMore) return;
    const next = offset + pageSize;
    setOffset(next);
    fetchPage(next, false);
  }, [state.loading, state.hasMore, offset, pageSize, fetchPage]);

  return {
    ...state,
    setFilter,
    loadMore,
    refresh: () => fetchPage(0, true),
  };
}
