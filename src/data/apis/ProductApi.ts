import { injectable } from 'tsyringe';
import { products } from '@/data/mocks';
import { storesByDistance } from '@/data/extendedMocks';
import type { ApiGenericResult } from '@shared/types/apiGenericResult';
import type { Paginado } from '@shared/types/pagination';
import type { Product, ProductFilter } from '@domain/entities/Product';

/**
 * `ProductApi` · cliente HTTP do contexto Vendas/Catálogo.
 *
 * Em produção · faz GET no gateway iPaaS Digibee, que orquestra
 * SAP S/4HANA Retail (master) + Algolia (search) + RFID (estoque vivo).
 *
 * Em DEV · resolve via mocks locais. **MAS preserva o envelope
 * ApiGenericResult<T>** para o RepositoryImpl unwrap igual à prod.
 */
@injectable()
export class ProductApi {
  async list(
    filter: ProductFilter,
    limit: number,
    offset: number,
  ): Promise<ApiGenericResult<Paginado<Product>>> {
    let pool: Product[] = products as Product[];

    if (filter.category) pool = pool.filter((p) => p.category === filter.category);
    if (filter.brand) pool = pool.filter((p) => p.brand === filter.brand);
    if (typeof filter.minPrice === 'number') pool = pool.filter((p) => p.price >= filter.minPrice!);
    if (typeof filter.maxPrice === 'number') pool = pool.filter((p) => p.price <= filter.maxPrice!);
    if (filter.inStockOnly) pool = pool.filter((p) => p.stockLocal + p.stockNetwork > 0);
    if (filter.query) {
      const q = filter.query.toLowerCase();
      pool = pool.filter((p) =>
        [p.name, p.sku, p.collection, p.description].some((v) => v?.toLowerCase().includes(q)),
      );
    }

    const slice = pool.slice(offset, offset + limit);
    const temMais = offset + limit < pool.length;

    return Promise.resolve({
      sucesso: true,
      mensagem: 'OK',
      erros: [],
      retorno: { itens: slice, temMais, limite: limit, offset },
    });
  }

  async getBySku(sku: string): Promise<ApiGenericResult<Product | null>> {
    const found = (products as Product[]).find((p) => p.sku === sku) ?? null;
    return Promise.resolve({
      sucesso: true,
      mensagem: found ? 'OK' : 'SKU não encontrado',
      erros: [],
      retorno: found,
    });
  }

  async getStockNetwork(_sku: string): Promise<
    ApiGenericResult<
      {
        storeId: string;
        storeName: string;
        units: number;
        distanceKm: number;
      }[]
    >
  > {
    const list = storesByDistance.map((s) => ({
      storeId: s.id,
      storeName: s.name,
      units: s.stockUnits,
      distanceKm: s.distanceKm,
    }));
    return Promise.resolve({
      sucesso: true,
      mensagem: 'OK',
      erros: [],
      retorno: list,
    });
  }
}
