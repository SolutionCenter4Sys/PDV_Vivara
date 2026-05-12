import { useCallback, useState } from 'react';
import { container } from '@core/di/container';
import { SearchCustomersUseCase } from '@domain/usecases/vendas';
import { ValidationError } from '@shared/errors';
import type { Customer } from '@domain/entities/Customer';

interface UseSearchCustomersState {
  results: Customer[];
  loading: boolean;
  error: string | null;
}

export function useSearchCustomers() {
  const [state, setState] = useState<UseSearchCustomersState>({
    results: [],
    loading: false,
    error: null,
  });

  const search = useCallback(async (query: string) => {
    setState({ results: [], loading: true, error: null });
    try {
      const uc = container.resolve(SearchCustomersUseCase);
      const results = await uc.execute({ query });
      setState({ results, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof ValidationError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Erro ao buscar clientes';
      setState({ results: [], loading: false, error: message });
    }
  }, []);

  return {
    ...state,
    search,
    reset: () => setState({ results: [], loading: false, error: null }),
  };
}
