import type { Customer, CustomerSearchInput } from '../entities/Customer';

export interface CustomerRepository {
  search(input: CustomerSearchInput): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
}
