import type { Customer } from './Customer';
import type { Product } from './Product';

export type PaymentMethod =
  | 'credit'
  | 'debit'
  | 'pix'
  | 'apple_pay'
  | 'google_pay'
  | 'crediario'
  | 'cash';

export interface CartItem {
  product: Product;
  quantity: number;
  customDiscountPct?: number;
}

export interface Order {
  id: string;
  customer?: Customer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  installments?: number;
  storeId: string;
  sellerId: string;
  brand: 'vivara' | 'life';
  createdAt: string;
  status: 'pending' | 'paid' | 'cancelled';
  fiscal: {
    chave?: string;
    qrCode?: string;
    issued: boolean;
    contingencyMode: boolean;
  };
}

export interface PlaceOrderInput {
  customerId?: string;
  items: Array<{
    sku: string;
    quantity: number;
    discountPct?: number;
  }>;
  paymentMethod: PaymentMethod;
  installments?: number;
  contingencyMode: boolean;
  storeId: string;
  sellerId: string;
}
