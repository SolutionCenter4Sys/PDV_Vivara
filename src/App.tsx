/**
 * Entrypoint de roteamento · arquivo fino que delega para `AppRoutes`.
 *
 * O verdadeiro mapa de rotas (com multi-tenant `/loja/:storeSlug/*`,
 * Suspense, ProtectedRoute e modules) vive em `@app/routes/AppRoutes`.
 */
import { AppRoutes } from '@app/routes/AppRoutes';

export default function App() {
  return <AppRoutes />;
}
