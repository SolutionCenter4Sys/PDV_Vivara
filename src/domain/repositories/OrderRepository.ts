import type { Order, PlaceOrderInput } from '../entities/Order';

export interface OrderRepository {
  place(input: PlaceOrderInput): Promise<Order>;
  listByCustomer(customerId: string): Promise<Order[]>;
}
