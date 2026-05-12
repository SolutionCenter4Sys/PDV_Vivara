import { inject, injectable } from 'tsyringe';
import { VendasTokens } from '@core/di/tokens/vendas/vendas.tokens';
import type { Product } from '@domain/entities/Product';
import type { ProductRepository } from '@domain/repositories/ProductRepository';

@injectable()
export class GetProductBySkuUseCase {
  constructor(
    @inject(VendasTokens.ProductRepository)
    private readonly repository: ProductRepository,
  ) {}

  async execute(sku: string): Promise<Product | null> {
    return this.repository.getBySku(sku);
  }
}
