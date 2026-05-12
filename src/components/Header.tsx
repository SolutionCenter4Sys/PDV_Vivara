import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  User,
  Sparkles,
  LogOut,
  LayoutDashboard,
  Wrench,
  Menu,
  X,
  ScanLine,
  RefreshCw,
  FileText,
  Scale,
  PackageCheck,
  Truck,
  Tablet,
  ListOrdered,
  Heart,
  MessageCircle,
  Calendar,
  Inbox,
  Package,
  Eye,
  Activity,
  Wallet,
} from 'lucide-react';
import clsx from 'clsx';
import { ConnectionBadge } from './ConnectionBadge';
import { CustomerQuickScanDialog } from './CustomerQuickScanDialog';
import { BrandSwitcher } from './BrandSwitcher';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';

const NAV_ITEMS = [
  { to: '/', label: 'Atendimento', icon: User },
  { to: '/catalogo', label: 'Catálogo', icon: Search },
  { to: '/inbox-clienteling', label: 'Inbox', icon: Inbox },
  { to: '/painel', label: 'Painel', icon: LayoutDashboard },
];

const OMNICHANNEL_ITEMS = [
  { to: '/bopis', label: 'Retirada (BOPIS)', icon: PackageCheck },
  { to: '/ship-from-store', label: 'Ship-from-Store', icon: Truck },
  { to: '/catalogo-estendido', label: 'Catálogo estendido', icon: Tablet },
  { to: '/oms', label: 'OMS Enterprise', icon: ListOrdered },
];

const CLIENTELING_ITEMS = [
  { to: '/wishlists', label: 'Wishlists', icon: Heart },
  { to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { to: '/agendamentos', label: 'Agendamentos', icon: Calendar },
];

const SERVICE_ITEMS = [
  { to: '/os', label: 'Ordem de Serviço', icon: Wrench },
  { to: '/troca', label: 'Troca', icon: RefreshCw },
  { to: '/consignacao', label: 'Consignação', icon: Package },
  { to: '/crediario', label: 'Crediário', icon: Wallet },
];

const ADMIN_ITEMS = [
  { to: '/fiscal', label: 'Fiscal', icon: FileText },
  { to: '/admin/tributos', label: 'Tributos', icon: Scale },
  { to: '/rfid', label: 'Inventário RFID', icon: ScanLine },
  { to: '/inventario-vivo', label: 'Inventário Vivo (LI-03)', icon: Eye },
  { to: '/noc', label: 'NOC · 11 lojas', icon: Activity },
];

export function Header() {
  const { seller, brand, cartCount, logout, toggleCopilot } = usePosStore();
  const location = useLocation();
  const navigate = useNavigate();
  const tp = useTenantPath();
  const items = cartCount();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const onPath = (p: string) => location.pathname === tp(p);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="max-w-grid-wide mx-auto px-4 lg:px-8 h-[80px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu de navegação"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 border border-border hover:bg-ink-1 transition"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <Link to={tp('/')} className="flex items-center gap-3 min-w-0">
            <span
              className={clsx(
                'font-serif text-2xl md:text-3xl tracking-[0.5em] uppercase font-semibold whitespace-nowrap',
                brand === 'vivara' ? 'text-ink-7' : 'text-life',
              )}
            >
              {brand === 'vivara' ? 'Vivara' : 'Life'}
            </span>
            <span className="hidden md:inline-block lg:hidden xl:inline-block text-[10px] uppercase tracking-label text-ink-5 font-bold border-l border-border pl-3 truncate max-w-[180px]">
              PDV · {seller?.storeName}
            </span>
          </Link>
        </div>

        <nav
          aria-label="Navegação principal"
          className="hidden lg:flex items-center gap-1"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={tp(to)}
              aria-current={onPath(to) ? 'page' : undefined}
              className={clsx(
                'px-4 py-2 text-[12px] uppercase tracking-cta font-medium transition',
                onPath(to)
                  ? 'text-ink-7 border-b-2 border-coral-200 pb-[6px]'
                  : 'text-ink-5 hover:text-ink-7',
              )}
            >
              <span className="flex items-center gap-2">
                <Icon size={14} aria-hidden="true" />
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <BrandSwitcher />
          <ConnectionBadge />
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 min-h-[44px] text-[11px] uppercase tracking-cta font-bold border border-ink-7 text-ink-7 hover:bg-ink-7 hover:text-white transition"
            title="Identificar cliente · QR / CPF / busca"
            aria-label="Identificar cliente · scan QR ou busca"
          >
            <ScanLine size={14} aria-hidden="true" />
            <span className="hidden xl:inline">Identificar</span>
            <span className="xl:hidden">QR</span>
          </button>
          <button
            type="button"
            onClick={toggleCopilot}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 min-h-[44px] text-[11px] uppercase tracking-cta font-bold bg-coral-50 text-coral-500 hover:bg-coral-100 transition"
            title="Copilot Living Intelligence"
            aria-label="Abrir Copilot Living Intelligence"
          >
            <Sparkles size={14} aria-hidden="true" />
            <span className="hidden xl:inline">Copilot LI</span>
            <span className="xl:hidden">LI</span>
          </button>
          <Link
            to={tp('/carrinho')}
            aria-label={`Carrinho · ${items} ${items === 1 ? 'peça' : 'peças'}`}
            className="relative inline-flex items-center justify-center w-11 h-11 md:w-12 md:h-12 border border-ink-7 hover:bg-ink-7 hover:text-white transition"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            {items > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-2 -right-2 bg-coral-200 text-ink-7 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {items}
              </span>
            )}
          </Link>
          <div className="hidden xl:flex items-center gap-2 text-[11px] uppercase tracking-cta font-bold text-ink-7">
            <div className="w-9 h-9 rounded-full bg-ink-7 text-white flex items-center justify-center font-serif font-semibold">
              {seller?.name.charAt(0)}
            </div>
            <span>{seller?.name.split(' ')[0]}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="w-11 h-11 inline-flex items-center justify-center text-ink-4 hover:text-ink-7 transition"
              title="Sair"
              aria-label="Sair do PDV"
            >
              <LogOut size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink-7/40 backdrop-blur-sm"
          />
          <div
            id="mobile-drawer"
            className="relative h-full w-[85%] max-w-sm bg-white shadow-elevated flex flex-col animate-[slide-in_180ms_ease-out]"
          >
            <div className="flex items-center justify-between px-5 h-[72px] border-b border-border">
              <span
                className={clsx(
                  'font-serif text-2xl tracking-[0.5em] uppercase font-semibold',
                  brand === 'vivara' ? 'text-ink-7' : 'text-life',
                )}
              >
                {brand === 'vivara' ? 'Vivara' : 'Life'}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex items-center justify-center w-10 h-10 border border-border hover:bg-ink-1 transition"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 py-4 border-b border-border-light">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-ink-7 text-white flex items-center justify-center font-serif font-semibold">
                  {seller?.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-7">{seller?.name}</p>
                  <p className="text-[11px] uppercase tracking-cta text-ink-5">
                    {seller?.storeName}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <ConnectionBadge />
              </div>
            </div>

            <nav
              aria-label="Menu principal"
              className="flex-1 overflow-y-auto py-2"
            >
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={tp(to)}
                  aria-current={onPath(to) ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-5 py-4 text-sm uppercase tracking-cta font-medium border-l-2 transition',
                    onPath(to)
                      ? 'text-ink-7 border-coral-500 bg-coral-50'
                      : 'text-ink-6 border-transparent hover:bg-ink-1',
                  )}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              ))}

              <div className="px-5 pt-5 pb-2 text-[10px] uppercase tracking-label font-bold text-ink-4">
                Omnichannel
              </div>
              {OMNICHANNEL_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={tp(to)}
                  aria-current={onPath(to) ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-5 py-3 text-sm uppercase tracking-cta font-medium border-l-2 transition',
                    onPath(to)
                      ? 'text-ink-7 border-coral-500 bg-coral-50'
                      : 'text-ink-6 border-transparent hover:bg-ink-1',
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </Link>
              ))}

              <div className="px-5 pt-5 pb-2 text-[10px] uppercase tracking-label font-bold text-ink-4">
                Clienteling
              </div>
              {CLIENTELING_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={tp(to)}
                  aria-current={onPath(to) ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-5 py-3 text-sm uppercase tracking-cta font-medium border-l-2 transition',
                    onPath(to)
                      ? 'text-ink-7 border-coral-500 bg-coral-50'
                      : 'text-ink-6 border-transparent hover:bg-ink-1',
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </Link>
              ))}

              <div className="px-5 pt-5 pb-2 text-[10px] uppercase tracking-label font-bold text-ink-4">
                Serviços
              </div>
              {SERVICE_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={tp(to)}
                  aria-current={onPath(to) ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-5 py-3 text-sm uppercase tracking-cta font-medium border-l-2 transition',
                    onPath(to)
                      ? 'text-ink-7 border-coral-500 bg-coral-50'
                      : 'text-ink-6 border-transparent hover:bg-ink-1',
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </Link>
              ))}

              <div className="px-5 pt-5 pb-2 text-[10px] uppercase tracking-label font-bold text-ink-4">
                Admin · NOC
              </div>
              {ADMIN_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={tp(to)}
                  aria-current={onPath(to) ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-5 py-3 text-sm uppercase tracking-cta font-medium border-l-2 transition',
                    onPath(to)
                      ? 'text-ink-7 border-coral-500 bg-coral-50'
                      : 'text-ink-6 border-transparent hover:bg-ink-1',
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="p-5 border-t border-border space-y-2">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setScanOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 text-[11px] uppercase tracking-cta font-bold border border-ink-7 text-ink-7 hover:bg-ink-7 hover:text-white transition"
              >
                <ScanLine size={14} aria-hidden="true" />
                Identificar cliente
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  toggleCopilot();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 text-[11px] uppercase tracking-cta font-bold bg-coral-50 text-coral-500 hover:bg-coral-100 transition"
              >
                <Sparkles size={14} aria-hidden="true" />
                Copilot Living Intelligence
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 text-[11px] uppercase tracking-cta font-bold border border-ink-7 text-ink-7 hover:bg-ink-7 hover:text-white transition"
              >
                <LogOut size={14} aria-hidden="true" />
                Encerrar turno
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerQuickScanDialog open={scanOpen} onClose={() => setScanOpen(false)} />
    </header>
  );
}
