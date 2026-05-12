import type { DependencyContainer } from 'tsyringe';
import { reg } from '@core/di/container';
import {
  ListProductsUseCase,
  GetProductBySkuUseCase,
  SearchCustomersUseCase,
  PlaceOrderUseCase,
} from '@domain/usecases/vendas';

/**
 * Registra UseCases do módulo Vendas.
 *
 * UseCases são por-classe (sem token Symbol) para preservar inferência
 * de tipo no `container.resolve(Cls)` e simplificar grep.
 */
export function registerVendasUseCases(c: DependencyContainer): void {
  reg(c, ListProductsUseCase);
  reg(c, GetProductBySkuUseCase);
  reg(c, SearchCustomersUseCase);
  reg(c, PlaceOrderUseCase);
}
