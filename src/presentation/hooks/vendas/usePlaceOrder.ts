import { useCallback, useState } from 'react';
import { container } from '@core/di/container';
import { PlaceOrderUseCase } from '@domain/usecases/vendas';
import type { Order, PlaceOrderInput } from '@domain/entities/Order';

interface UsePlaceOrderState {
  loading: boolean;
  error: string | null;
  order: Order | null;
}

export function usePlaceOrder() {
  const [state, setState] = useState<UsePlaceOrderState>({
    loading: false,
    error: null,
    order: null,
  });

  const place = useCallback(async (input: PlaceOrderInput) => {
    setState({ loading: true, error: null, order: null });
    try {
      const uc = container.resolve(PlaceOrderUseCase);
      const order = await uc.execute(input);
      setState({ loading: false, error: null, order });
      return order;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao finalizar pedido';
      setState({ loading: false, error: message, order: null });
      throw err;
    }
  }, []);

  return { ...state, place };
}
