import { inject, injectable } from 'tsyringe';
import { VendasTokens } from '@core/di/tokens/vendas/vendas.tokens';
import { ApiBusinessError } from '@shared/errors';
import type { CustomerRepository } from '@domain/repositories/CustomerRepository';
import type { Customer, CustomerSearchInput } from '@domain/entities/Customer';
import type { ApiGenericResult } from '@shared/types/apiGenericResult';
import type { CustomerApi } from '../apis/CustomerApi';

@injectable()
export class CustomerRepositoryImpl implements CustomerRepository {
  constructor(
    @inject(VendasTokens.CustomerApi)
    private readonly api: CustomerApi,
  ) {}

  async search(input: CustomerSearchInput): Promise<Customer[]> {
    return this.unwrap(await this.api.search(input));
  }

  async getById(id: string): Promise<Customer | null> {
    return this.unwrap(await this.api.getById(id));
  }

  private unwrap<T>(env: ApiGenericResult<T>): T {
    if (!env.sucesso) throw new ApiBusinessError(env.mensagem, env.erros);
    return env.retorno;
  }
}
