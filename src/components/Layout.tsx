import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './Header';
import { CopilotPanel } from './CopilotPanel';
import { OfflineBanner } from './OfflineBanner';
import { SalesBagBar } from './SalesBagBar';
import { useNocSimulator } from '@/hooks/useNocSimulator';
import { useAppSelector } from '@app/store/hooks';
import { useBrandTheme } from '@/presentation/hooks/useBrandTheme';
import { usePosStore } from '@/store/usePosStore';

export function Layout() {
  useNocSimulator();
  useBrandTheme();
  const tenant = useAppSelector((s) => s.tenant.active);
  const cartCount = usePosStore((s) => s.cartCount);
  const hasItems = cartCount() > 0;

  return (
    <div className="min-h-screen-d bg-white flex flex-col">
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo
      </a>
      <Header />
      <OfflineBanner />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <div className="max-w-grid-wide mx-auto px-4 md:px-6 lg:px-8 pdv:px-12 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
      <footer
        className={
          'border-t border-border py-4 px-4 md:px-6 lg:px-8 text-center text-[11px] uppercase tracking-cta text-ink-5 ' +
          (hasItems ? 'pb-28 md:pb-24' : '')
        }
      >
        <div>Novo PDV Vivara · Foursys · Clean Arch + TSyringe + Redux + MSAL</div>
        {tenant && (
          <div className="mt-1 text-[10px] text-ink-4">
            Tenant ativo · {tenant.name} · {tenant.city}/{tenant.uf} · cluster iPaaS{' '}
            {tenant.ipaasCluster.toUpperCase()} · CNPJ {tenant.cnpj}
          </div>
        )}
      </footer>
      <SalesBagBar />
      <CopilotPanel />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={5000}
        toastOptions={{
          classNames: {
            toast: 'font-sans border border-border',
            title: 'font-bold tracking-cta uppercase text-[12px]',
            description: 'text-[12px] text-ink-6',
          },
        }}
      />
    </div>
  );
}
