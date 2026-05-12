/**
 * Tokens transversais · padrão Eliza/Fourblox.
 * Símbolos para resolver dependências cross-cutting (HTTP, Auth, Tenant).
 */
export const CoreTokens = {
  HttpClient: Symbol.for('core.HttpClient'),
  MsalService: Symbol.for('core.MsalService'),
  TenantService: Symbol.for('core.TenantService'),
} as const;
