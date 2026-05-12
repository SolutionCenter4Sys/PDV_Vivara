import { inject, injectable } from 'tsyringe';
import { VendasTokens } from '@core/di/tokens/vendas/vendas.tokens';
import type { Order, PlaceOrderInput } from '@domain/entities/Order';
import type { OrderRepository } from '@domain/repositories/OrderRepository';
import { ValidationError } from '@shared/errors';

@injectable()
export class PlaceOrderUseCase {
  constructor(
    @inject(VendasTokens.OrderRepository)
    private readonly repository: OrderRepository,
  ) {}

  async execute(input: PlaceOrderInput): Promise<Order> {
    if (input.items.length === 0) {
      throw new ValidationError('Carrinho vazio', 'items');
    }
    if (!input.storeId) throw new ValidationError('storeId obrigatório', 'storeId');
    if (!input.sellerId) throw new ValidationError('sellerId obrigatório', 'sellerId');
    return this.repository.place(input);
  }
}
