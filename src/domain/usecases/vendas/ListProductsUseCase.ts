import { inject, injectable } from 'tsyringe';
import { VendasTokens } from '@core/di/tokens/vendas/vendas.tokens';
import type { ProductFilter, Product } from '@domain/entities/Product';
import type { ProductRepository } from '@domain/repositories/ProductRepository';
import type { Paginado } from '@shared/types/pagination';

export interface ListProductsRequest {
  filter?: ProductFilter;
  limit?: number;
  offset?: number;
}

export type ListProductsResponse = Paginado<Product>;

/**
 * UC: GET /Vendas/ListarProdutos · catálogo paginado.
 *
 * Uma classe por intenção. NÃO existe `ListProductsAndStockUseCase`
 * facade — caso a UI precise de ambos, hooks compõem.
 */
@injectable()
export class ListProductsUseCase {
  constructor(
    @inject(VendasTokens.ProductRepository)
    private readonly repository: ProductRepository,
  ) {}

  async execute(req: ListProductsRequest = {}): Promise<ListProductsResponse> {
    const filter = req.filter ?? {};
    const limit = req.limit ?? 24;
    const offset = req.offset ?? 0;
    return this.repository.list(filter, limit, offset);
  }
}
