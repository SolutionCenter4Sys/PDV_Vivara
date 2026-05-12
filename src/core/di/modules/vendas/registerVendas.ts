import type { DependencyContainer } from 'tsyringe';
import { VendasTokens } from '@core/di/tokens/vendas/vendas.tokens';
import { ProductApi } from '@data/apis/ProductApi';
import { CustomerApi } from '@data/apis/CustomerApi';
import { OrderApi } from '@data/apis/OrderApi';
import { ProductRepositoryImpl } from '@data/repositories/ProductRepositoryImpl';
import { CustomerRepositoryImpl } from '@data/repositories/CustomerRepositoryImpl';
import { OrderRepositoryImpl } from '@data/repositories/OrderRepositoryImpl';

/**
 * Registra APIs + Repositories do módulo Vendas.
 *
 * Singleton para preservar caches inter-rota (estoque, etc.).
 */
export function registerVendas(c: DependencyContainer): void {
  c.registerSingleton(VendasTokens.ProductApi, ProductApi);
  c.registerSingleton(VendasTokens.CustomerApi, CustomerApi);
  c.registerSingleton(VendasTokens.OrderApi, OrderApi);

  c.registerSingleton(VendasTokens.ProductRepository, ProductRepositoryImpl);
  c.registerSingleton(VendasTokens.CustomerRepository, CustomerRepositoryImpl);
  c.registerSingleton(VendasTokens.OrderRepository, OrderRepositoryImpl);
}
