import { injectable } from 'tsyringe';
import { orders, getCustomerById, getProductBySku } from '@/data/mocks';
import type { ApiGenericResult } from '@shared/types/apiGenericResult';
import type { Order, PlaceOrderInput } from '@domain/entities/Order';

@injectable()
export class OrderApi {
  async place(input: PlaceOrderInput): Promise<ApiGenericResult<Order>> {
    const items = input.items
      .map((it) => {
        const product = getProductBySku(it.sku);
        if (!product) return null;
        return {
          product,
          quantity: it.quantity,
          customDiscountPct: it.discountPct,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const subtotal = items.reduce(
      (acc, it) => acc + it.product.price * it.quantity,
      0,
    );
    const discount = items.reduce(
      (acc, it) => acc + (it.product.price * it.quantity * (it.customDiscountPct ?? 0)) / 100,
      0,
    );
    const total = subtotal - discount;

    const order: Order = {
      id: `OS-${Date.now()}`,
      customer: input.customerId ? (getCustomerById(input.customerId) ?? undefined) : undefined,
      items,
      subtotal,
      discount,
      total,
      paymentMethod: input.paymentMethod,
      installments: input.installments,
      storeId: input.storeId,
      sellerId: input.sellerId,
      brand: 'vivara',
      createdAt: new Date().toISOString(),
      status: 'paid',
      fiscal: {
        chave: input.contingencyMode
          ? undefined
          : `35${new Date().getFullYear()}${Math.random().toString().slice(2, 8)}`,
        issued: !input.contingencyMode,
        contingencyMode: input.contingencyMode,
      },
    };

    // simula push em base mock para list*
    (orders as Order[]).unshift(order);

    return Promise.resolve({
      sucesso: true,
      mensagem: 'OK',
      erros: [],
      retorno: order,
    });
  }

  async listByCustomer(
    customerId: string,
  ): Promise<ApiGenericResult<Order[]>> {
    const list = (orders as Order[]).filter((o) => o.customer?.id === customerId);
    return Promise.resolve({
      sucesso: true,
      mensagem: 'OK',
      erros: [],
      retorno: list,
    });
  }
}
