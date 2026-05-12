import { useEffect, type ReactNode } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { container } from '@core/di/container';
import { CoreTokens } from '@core/di/tokens/core.tokens';
import type { TenantService } from '@core/tenant/TenantService';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { setActiveTenant } from '@app/store/slices/tenantSlice';

/**
 * TenantProvider · sincroniza `:storeSlug` da URL com o Redux + DI.
 *
 * Regras:
 *   - URL `/loja/:storeSlug/...` → resolve via TenantService → grava em Redux.
 *   - Slug inexistente → redireciona para `/loja/<lastOrDefault>/`.
 *   - Persiste lastStoreSlug no localStorage (TenantService faz isso).
 *
 * Multi-tenant cosmético também: o Layout lê `tenant.active` para alterar
 * brand color / nome da loja exibido no Header.
 */
interface Props {
  children: ReactNode;
}

export function TenantProvider({ children }: Props) {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const active = useAppSelector((s) => s.tenant.active);

  useEffect(() => {
    const tenant = container.resolve<TenantService>(CoreTokens.TenantService);

    if (!storeSlug) {
      const fallback = tenant.current();
      const target = location.pathname.replace(/^\/+/, '');
      const next = target ? `/loja/${fallback.slug}/${target}` : `/loja/${fallback.slug}/`;
      navigate(next, { replace: true });
      return;
    }

    const resolved = tenant.setCurrentBySlug(storeSlug);
    if (!resolved) {
      const fallback = tenant.current();
      navigate(`/loja/${fallback.slug}/`, { replace: true });
      return;
    }
    if (active?.slug !== resolved.slug) {
      dispatch(setActiveTenant(resolved));
    }
  }, [storeSlug, location.pathname, navigate, dispatch, active?.slug]);

  return <>{children}</>;
}
