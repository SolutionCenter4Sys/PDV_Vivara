import { inject, injectable } from 'tsyringe';
import { VendasTokens } from '@core/di/tokens/vendas/vendas.tokens';
import { ApiBusinessError } from '@shared/errors';
import type { OrderRepository } from '@domain/repositories/OrderRepository';
import type { Order, PlaceOrderInput } from '@domain/entities/Order';
import type { ApiGenericResult } from '@shared/types/apiGenericResult';
import type { OrderApi } from '../apis/OrderApi';

@injectable()
export class OrderRepositoryImpl implements OrderRepository {
  constructor(
    @inject(VendasTokens.OrderApi)
    private readonly api: OrderApi,
  ) {}

  async place(input: PlaceOrderInput): Promise<Order> {
    return this.unwrap(await this.api.place(input));
  }

  async listByCustomer(customerId: string): Promise<Order[]> {
    return this.unwrap(await this.api.listByCustomer(customerId));
  }

  private unwrap<T>(env: ApiGenericResult<T>): T {
    if (!env.sucesso) throw new ApiBusinessError(env.mensagem, env.erros);
    return env.retorno;
  }
}
