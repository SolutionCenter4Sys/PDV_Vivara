/**
 * Bootstrap do container · ordem importa.
 *
 * 1. Core transversal (Http, Tenant, Msal)
 * 2. Módulos de negócio (registers + UseCases)
 *
 * Cada módulo NOVO adiciona EXATAMENTE 2 imports + 2 chamadas no final
 * deste arquivo. Não editar no meio · diff mínimo.
 */
import 'reflect-metadata';

import { container } from './container';
import { CoreTokens } from './tokens/core.tokens';

import { TenantService } from '@core/tenant/TenantService';
import { MsalService } from '@core/auth/MsalService';
import { createHttpClient } from '@core/http/httpClient';

import { registerVendas } from './modules/vendas/registerVendas';
import { registerVendasUseCases } from './modules/vendas/registerVendasUseCases';

let booted = false;

export function setupDependencyInjection(): void {
  if (booted) return;
  booted = true;

  // 1) Core
  container.registerSingleton(CoreTokens.TenantService, TenantService);
  container.registerSingleton(CoreTokens.MsalService, MsalService);

  const tenant = container.resolve<TenantService>(CoreTokens.TenantService);
  const msal = container.resolve<MsalService>(CoreTokens.MsalService);

  let cachedToken: string | null = null;

  const httpClient = createHttpClient({
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    getToken: () => cachedToken,
    getStoreId: () => tenant.current().storeId,
    onUnauthorized: () => {
      window.location.href = '/login';
    },
  });
  container.registerInstance(CoreTokens.HttpClient, httpClient);

  // MSAL async kickoff · refresh do token a cada 50min
  msal
    .initialize()
    .then(async () => {
      if (msal.isEnabled()) {
        cachedToken = await msal.getToken();
        setInterval(
          async () => {
            try {
              cachedToken = await msal.getToken();
            } catch {
              cachedToken = null;
            }
          },
          50 * 60 * 1000,
        );
      }
    })
    .catch(() => {
      // MSAL não configurado · operando com fallback PIN
    });

  // 2) Módulos de negócio
  registerVendas(container);
  registerVendasUseCases(container);
}
