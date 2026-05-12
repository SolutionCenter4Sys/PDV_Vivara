import { injectable } from 'tsyringe';
import { customers } from '@/data/mocks';
import type { ApiGenericResult } from '@shared/types/apiGenericResult';
import type { Customer, CustomerSearchInput } from '@domain/entities/Customer';

@injectable()
export class CustomerApi {
  async search(
    input: CustomerSearchInput,
  ): Promise<ApiGenericResult<Customer[]>> {
    const q = input.query.toLowerCase().replace(/\D/g, '') || input.query.toLowerCase();
    const numericQ = q.replace(/\D/g, '');
    const matches = (customers as Customer[]).filter((c) => {
      const cpfClean = c.cpf.replace(/\D/g, '');
      return (
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.email.toLowerCase().includes(q.toLowerCase()) ||
        (numericQ.length > 0 && cpfClean.includes(numericQ))
      );
    });

    return Promise.resolve({
      sucesso: true,
      mensagem: 'OK',
      erros: [],
      retorno: matches,
    });
  }

  async getById(id: string): Promise<ApiGenericResult<Customer | null>> {
    const found = (customers as Customer[]).find((c) => c.id === id) ?? null;
    return Promise.resolve({
      sucesso: true,
      mensagem: found ? 'OK' : 'Cliente não encontrado',
      erros: [],
      retorno: found,
    });
  }
}
