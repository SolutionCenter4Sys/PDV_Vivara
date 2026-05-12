import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { RouteFallback } from '@/components/RouteFallback';
import { useAppSelector } from '@app/store/hooks';
import { TenantProvider } from '@app/providers/TenantProvider';
import { container } from '@core/di/container';
import { CoreTokens } from '@core/di/tokens/core.tokens';
import type { TenantService } from '@core/tenant/TenantService';
import { VendasRoutes } from './modules/vendas/VendasRoutes';

/**
 * AppRoutes · padrão Eliza/Fourblox v2 com multi-tenant por rota.
 *
 * Estrutura de URL:
 *   /login                       (público · sem tenant)
 *   /loja/:storeSlug/*           (protegido · 11 lojas Vivara mock)
 *   /                            (RootRedirect → /loja/<lastOrDefault>/)
 *
 * Children-Route pattern: módulos exportam Fragment de `<Route>` filhos
 * spread-ado neste Routes (evita `<Routes>` aninhado · v6 friendly).
 */

const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);

function ProtectedRoute({ children }: { children: ReactNode }) {
  const seller = useAppSelector((s) => s.auth.seller);
  const location = useLocation();
  if (!seller) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

function TenantShell() {
  return (
    <TenantProvider>
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    </TenantProvider>
  );
}

/**
 * RootRedirect · resolve o tenant ativo no boot e redireciona.
 * Evita renderizar Layout antes do TenantProvider concluir.
 */
function RootRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const tenant = container.resolve<TenantService>(CoreTokens.TenantService);
    navigate(`/loja/${tenant.current().slug}/`, { replace: true });
  }, [navigate]);
  return <RouteFallback />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Multi-tenant por rota · /loja/:storeSlug/* */}
        <Route path="/loja/:storeSlug" element={<TenantShell />}>
          {VendasRoutes}
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
