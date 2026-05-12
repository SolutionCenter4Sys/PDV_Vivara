import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import customerReducer from './slices/customerSlice';
import connectivityReducer from './slices/connectivitySlice';
import copilotReducer from './slices/copilotSlice';
import tenantReducer from './slices/tenantSlice';
import wishlistReducer from './slices/wishlistSlice';

/**
 * Redux Toolkit store · padrão Eliza/Fourblox v2.
 *
 * Persistência: subset (auth.seller, auth.brand, tenant.active) via
 * middleware leve abaixo · localStorage chave `pdv-vivara-store`.
 */
const PERSIST_KEY = 'pdv-vivara-store';

interface PersistedShape {
  seller: ReturnType<typeof authReducer>['seller'];
  brand: ReturnType<typeof authReducer>['brand'];
  authMode: ReturnType<typeof authReducer>['authMode'];
  ssoEmail: ReturnType<typeof authReducer>['ssoEmail'];
  tenantSlug?: string | null;
}

function loadPreloaded():
  | {
      auth: ReturnType<typeof authReducer>;
      tenant: ReturnType<typeof tenantReducer>;
    }
  | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedShape;
    return {
      auth: {
        seller: parsed.seller ?? null,
        brand: parsed.brand ?? 'vivara',
        authMode: parsed.authMode ?? null,
        ssoEmail: parsed.ssoEmail ?? null,
      },
      tenant: { active: null }, // resolvido no AppProvider via TenantService.current()
    };
  } catch {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    customer: customerReducer,
    connectivity: connectivityReducer,
    copilot: copilotReducer,
    tenant: tenantReducer,
    wishlist: wishlistReducer,
  },
  preloadedState: loadPreloaded(),
});

store.subscribe(() => {
  if (typeof window === 'undefined') return;
  const s = store.getState();
  const persisted: PersistedShape = {
    seller: s.auth.seller,
    brand: s.auth.brand,
    authMode: s.auth.authMode,
    ssoEmail: s.auth.ssoEmail,
    tenantSlug: s.tenant.active?.slug ?? null,
  };
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(persisted));
  } catch {
    /* noop */
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
