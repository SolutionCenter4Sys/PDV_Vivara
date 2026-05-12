import { inject, injectable } from 'tsyringe';
import { VendasTokens } from '@core/di/tokens/vendas/vendas.tokens';
import { ApiBusinessError } from '@shared/errors';
import type { ProductRepository } from '@domain/repositories/ProductRepository';
import type { Product, ProductFilter } from '@domain/entities/Product';
import type { Paginado } from '@shared/types/pagination';
import type { ApiGenericResult } from '@shared/types/apiGenericResult';
import type { ProductApi } from '../apis/ProductApi';

/**
 * RepositoryImpl é a ÚNICA camada que conhece o envelope `ApiGenericResult`.
 *
 * Domain/UseCase/Presentation só veem o tipo "limpo" (T).
 * Se `sucesso === false` aqui · joga ApiBusinessError e UI captura no boundary.
 */
@injectable()
export class ProductRepositoryImpl implements ProductRepository {
  constructor(
    @inject(VendasTokens.ProductApi)
    private readonly api: ProductApi,
  ) {}

  async list(
    filter: ProductFilter,
    limit: number,
    offset: number,
  ): Promise<Paginado<Product>> {
    const env = await this.api.list(filter, limit, offset);
    return this.unwrap(env);
  }

  async getBySku(sku: string): Promise<Product | null> {
    const env = await this.api.getBySku(sku);
    return this.unwrap(env);
  }

  async getStockNetwork(sku: string): Promise<
    {
      storeId: string;
      storeName: string;
      units: number;
      distanceKm: number;
    }[]
  > {
    const env = await this.api.getStockNetwork(sku);
    return this.unwrap(env);
  }

  private unwrap<T>(env: ApiGenericResult<T>): T {
    if (!env.sucesso) {
      throw new ApiBusinessError(env.mensagem || 'Erro de negócio', env.erros);
    }
    return env.retorno;
  }
}
