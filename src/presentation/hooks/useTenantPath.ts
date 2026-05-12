import { useCallback } from 'react';
import { useAppSelector } from '@app/store/hooks';
import { container } from '@core/di/container';
import { CoreTokens } from '@core/di/tokens/core.tokens';
import type { TenantService } from '@core/tenant/TenantService';

/**
 * `useTenantPath()` · gera URLs com o slug da loja ativa.
 *
 *   tp('/')              → /loja/morumbi/
 *   tp('/catalogo')      → /loja/morumbi/catalogo
 *   tp('cliente/123')    → /loja/morumbi/cliente/123
 *   tp('/login')         → /login   (rotas públicas mantêm prefixo)
 *
 * Usado por Header, Layout e quaisquer Link/navigate dentro do shell tenant.
 */
const PUBLIC_PREFIXES = ['/login'];

export function useTenantPath() {
  const slug = useAppSelector((s) => s.tenant.active?.slug);

  return useCallback(
    (path: string): string => {
      if (PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
        return path;
      }
      const tenantSlug =
        slug ?? container.resolve<TenantService>(CoreTokens.TenantService).current().slug;
      const cleaned = path.replace(/^\/+/, '');
      return cleaned ? `/loja/${tenantSlug}/${cleaned}` : `/loja/${tenantSlug}/`;
    },
    [slug],
  );
}
