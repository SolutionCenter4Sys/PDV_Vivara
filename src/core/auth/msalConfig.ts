import type { Configuration, PopupRequest } from '@azure/msal-browser';

/**
 * Multi-tenant Microsoft 365 · padrão Eliza/Fourblox aplicado ao PDV Vivara.
 *
 * Em prod · cada loja Vivara herda as credenciais do Azure AD da matriz
 * (tenant `vivara.com.br`) com escopo `User.Read` + `Group.Read.All` para
 * resolver o vendedor + cargo + loja autorizada.
 *
 * Variáveis de ambiente (defina em .env.local):
 *   VITE_MSAL_TENANT_ID  ← GUID Azure AD Vivara
 *   VITE_MSAL_CLIENT_ID  ← App registrada para PDV
 *   VITE_MSAL_REDIRECT   ← http://localhost:7001/login (dev)
 *
 * Sem essas vars · MSAL fica dormente e o fallback PIN continua ativo
 * (ver MsalService.isEnabled).
 */

const tenantId = import.meta.env.VITE_MSAL_TENANT_ID as string | undefined;
const clientId = import.meta.env.VITE_MSAL_CLIENT_ID as string | undefined;
const redirectUri =
  (import.meta.env.VITE_MSAL_REDIRECT as string | undefined) ?? window.location.origin;

export const msalConfigured = Boolean(tenantId && clientId);

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId ?? '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      logLevel: 0, // Error only
    },
  },
};

export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'profile', 'openid', 'email'],
  prompt: 'select_account',
};
