import type { Product, ProductFilter } from '../entities/Product';
import type { Paginado } from '@shared/types/pagination';

/**
 * Contrato `ProductRepository` · agregado por contexto de back
 * (não por tela). Catálogo + Estoque vivem juntos.
 */
export interface ProductRepository {
  list(filter: ProductFilter, limit: number, offset: number): Promise<Paginado<Product>>;
  getBySku(sku: string): Promise<Product | null>;
  getStockNetwork(sku: string): Promise<{
    storeId: string;
    storeName: string;
    units: number;
    distanceKm: number;
  }[]>;
}
