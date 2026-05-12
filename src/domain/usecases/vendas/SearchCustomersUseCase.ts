import { inject, injectable } from 'tsyringe';
import { VendasTokens } from '@core/di/tokens/vendas/vendas.tokens';
import type { Customer } from '@domain/entities/Customer';
import type { CustomerRepository } from '@domain/repositories/CustomerRepository';
import { ValidationError } from '@shared/errors';

export interface SearchCustomersRequest {
  query: string;
}

@injectable()
export class SearchCustomersUseCase {
  constructor(
    @inject(VendasTokens.CustomerRepository)
    private readonly repository: CustomerRepository,
  ) {}

  async execute(req: SearchCustomersRequest): Promise<Customer[]> {
    const q = req.query.trim();
    if (q.length < 3) {
      throw new ValidationError('Informe pelo menos 3 caracteres', 'query');
    }
    return this.repository.search({ query: q });
  }
}
