/**
 * `usePosStore` · ADAPTER Zustand → Redux Toolkit (compatível MSAL/multi-tenant).
 *
 * O store original usava Zustand. Hoje a fonte da verdade é o Redux store
 * (`src/app/store/store.ts`) seguindo o padrão Eliza/Fourblox v2.
 *
 * Este adapter preserva a API legada (`usePosStore(s => s.cart)`,
 * `s.addToCart(p)`, `s.cartTotal()`) para que os 15+ componentes existentes
 * continuem funcionando sem mudança. Códigos NOVOS devem usar
 * `useAppSelector` + `useAppDispatch` direto + UseCases via DI.
 */
import { useSyncExternalStore } from 'react';
import type {
  Brand,
  CartItem,
  ConnectivityStatus,
  CopilotNudge,
  Customer,
  Product,
  Seller,
} from '@/types';
import { sellers } from '@/data/mocks';
import { store } from '@app/store/store';
import {
  loginPinSuccess,
  logout as logoutAction,
} from '@app/store/slices/authSlice';
import {
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  updateQuantity as updateQuantityAction,
  applyDiscount as applyDiscountAction,
  clearCart as clearCartAction,
} from '@app/store/slices/cartSlice';
import { selectCustomer as selectCustomerAction } from '@app/store/slices/customerSlice';
import { setStatus as setConnStatus } from '@app/store/slices/connectivitySlice';
import {
  dismissNudge as dismissNudgeAction,
  toggleCopilot as toggleCopilotAction,
} from '@app/store/slices/copilotSlice';
import {
  selectCartSubtotal,
  selectCartDiscount,
  selectCartTotal,
  selectCartCount,
} from '@app/store/selectors';

interface PosShape {
  // Auth
  seller: Seller | null;
  brand: Brand;
  // Connectivity
  connectivity: ConnectivityStatus;
  syncQueue: number;
  offline: boolean;
  queuedTransactions: number;
  // Atendimento
  activeCustomer: Customer | null;
  cart: CartItem[];
  // Copilot
  nudges: CopilotNudge[];
  dismissedNudges: string[];
  copilotOpen: boolean;
  // Actions
  login: (pin: string) => Seller | null;
  logout: () => void;
  setConnectivity: (status: ConnectivityStatus) => void;
  selectCustomer: (customer: Customer | null) => void;
  /**
   * Encerra a sessao de atendimento ativa: desvincula o cliente,
   * limpa a sacola e prepara o turno para o proximo cliente.
   * Equivale a um "trocar atendimento" e tem semantica clara para a UI.
   */
  endAttendance: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  applyDiscount: (productId: string, pct: number) => void;
  clearCart: () => void;
  dismissNudge: (id: string) => void;
  toggleCopilot: () => void;
  cartSubtotal: () => number;
  cartDiscount: () => number;
  cartTotal: () => number;
  cartCount: () => number;
}

function buildShape(): PosShape {
  const s = store.getState();
  return {
    seller: s.auth.seller,
    brand: s.auth.brand,
    connectivity: s.connectivity.status,
    syncQueue: s.connectivity.syncQueue,
    offline: s.connectivity.status === 'offline',
    queuedTransactions: s.connectivity.syncQueue,
    activeCustomer: s.customer.active,
    cart: s.cart.items,
    nudges: s.copilot.nudges,
    dismissedNudges: s.copilot.dismissedIds,
    copilotOpen: s.copilot.open,
    login: (pin: string) => {
      const seller = sellers.find((x) => x.pin === pin) ?? null;
      if (seller) store.dispatch(loginPinSuccess(seller));
      return seller;
    },
    logout: () => {
      store.dispatch(logoutAction());
      store.dispatch(selectCustomerAction(null));
      store.dispatch(clearCartAction());
    },
    setConnectivity: (status) => {
      store.dispatch(setConnStatus(status));
    },
    selectCustomer: (customer) => {
      store.dispatch(selectCustomerAction(customer));
    },
    endAttendance: () => {
      store.dispatch(clearCartAction());
      store.dispatch(selectCustomerAction(null));
    },
    addToCart: (product, quantity = 1) => {
      store.dispatch(addToCartAction({ product, quantity }));
    },
    removeFromCart: (productId) => {
      store.dispatch(removeFromCartAction(productId));
    },
    updateQuantity: (productId, qty) => {
      store.dispatch(updateQuantityAction({ productId, quantity: qty }));
    },
    applyDiscount: (productId, pct) => {
      store.dispatch(applyDiscountAction({ productId, discountPct: pct }));
    },
    clearCart: () => {
      store.dispatch(clearCartAction());
      store.dispatch(selectCustomerAction(null));
    },
    dismissNudge: (id) => {
      store.dispatch(dismissNudgeAction(id));
    },
    toggleCopilot: () => {
      store.dispatch(toggleCopilotAction());
    },
    cartSubtotal: () => selectCartSubtotal(store.getState()),
    cartDiscount: () => selectCartDiscount(store.getState()),
    cartTotal: () => selectCartTotal(store.getState()),
    cartCount: () => selectCartCount(store.getState()),
  };
}

let cached: PosShape = buildShape();
let cachedKey = '';
function snapshot(): PosShape {
  const s = store.getState();
  // chave estrutural · evita rebuild quando nada relevante mudou.
  const key = [
    s.auth.seller?.id ?? '',
    s.auth.brand,
    s.connectivity.status,
    s.connectivity.syncQueue,
    s.customer.active?.id ?? '',
    s.cart.items.length,
    s.cart.items.map((i) => `${i.product.id}:${i.quantity}:${i.customDiscountPct ?? ''}`).join('|'),
    s.copilot.dismissedIds.length,
    s.copilot.open ? 1 : 0,
  ].join('::');

  if (key !== cachedKey) {
    cached = buildShape();
    cachedKey = key;
  }
  return cached;
}

const subscribe = (cb: () => void): (() => void) => store.subscribe(cb);

/**
 * Hook compatível com a API Zustand original.
 * Suporta `usePosStore()` e `usePosStore(selector)`.
 */
export function usePosStore(): PosShape;
export function usePosStore<T>(selector: (s: PosShape) => T): T;
export function usePosStore<T>(selector?: (s: PosShape) => T): PosShape | T {
  const shape = useSyncExternalStore(subscribe, snapshot, snapshot);
  return selector ? selector(shape) : shape;
}

usePosStore.getState = () => snapshot();
