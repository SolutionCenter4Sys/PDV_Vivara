import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, CreditCard, User } from 'lucide-react';
import clsx from 'clsx';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { formatBRL } from '@/utils/format';

/**
 * SalesBagBar · barra de "Sacola da venda" persistente.
 *
 * Aparece fixa no rodapé sempre que há itens no carrinho durante a sessão de
 * atendimento, deixando visível o caminho `Sacola → Pagamento`. Some quando
 * o vendedor já está dentro do fluxo de checkout (carrinho/pagamento) para
 * não duplicar CTAs.
 */
export function SalesBagBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const tp = useTenantPath();
  const cart = usePosStore((s) => s.cart);
  const cartCount = usePosStore((s) => s.cartCount);
  const cartTotal = usePosStore((s) => s.cartTotal);
  const activeCustomer = usePosStore((s) => s.activeCustomer);

  const items = cartCount();
  const total = cartTotal();

  const cartPath = tp('/carrinho');
  const paymentPath = tp('/pagamento');
  const isOnCart = location.pathname === cartPath;
  const isOnPayment = location.pathname === paymentPath;

  if (cart.length === 0 || isOnCart || isOnPayment) {
    return null;
  }

  const goToCart = () => navigate(cartPath);
  const goToPayment = () => navigate(paymentPath);

  return (
    <div
      role="region"
      aria-label="Sacola da venda · resumo flutuante"
      className={clsx(
        'fixed inset-x-0 bottom-0 z-30 bg-ink-7 text-white shadow-elevated',
        'border-t-4 border-coral-500 print:hidden',
      )}
    >
      <div className="max-w-grid-wide mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4 flex items-center gap-3 md:gap-5 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            aria-hidden="true"
            className="w-11 h-11 md:w-12 md:h-12 bg-coral-500 text-white flex items-center justify-center flex-shrink-0 relative"
          >
            <ShoppingBag size={20} />
            <span
              aria-hidden="true"
              className="absolute -top-2 -right-2 bg-white text-ink-7 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {items}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-label font-bold text-coral-200">
              Sacola da venda
            </div>
            <div className="font-serif text-lg md:text-xl font-semibold leading-tight">
              {items} {items === 1 ? 'peça' : 'peças'} ·{' '}
              <span className="text-coral-200">{formatBRL(total)}</span>
            </div>
            {activeCustomer ? (
              <div className="text-[11px] text-white/70 truncate flex items-center gap-1">
                <User size={11} aria-hidden="true" />
                Cliente: <strong className="text-white">{activeCustomer.name}</strong>
              </div>
            ) : (
              <div className="text-[11px] text-coral-200/80 truncate">
                Identifique o cliente para vincular esta venda
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={goToCart}
            className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 min-h-[44px] text-[11px] uppercase tracking-cta font-bold border border-white/40 text-white hover:bg-white/10 transition flex-1 sm:flex-none"
            aria-label={`Ver sacola completa · ${items} ${items === 1 ? 'peça' : 'peças'}`}
          >
            <ShoppingBag size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Ver sacola</span>
            <span className="sm:hidden">Sacola</span>
          </button>
          <button
            type="button"
            onClick={goToPayment}
            className="inline-flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 min-h-[44px] text-[11px] uppercase tracking-cta font-bold bg-coral-500 text-white hover:bg-coral-600 transition flex-1 sm:flex-none"
            aria-label={`Ir direto ao pagamento · ${formatBRL(total)}`}
          >
            <CreditCard size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Pagamento</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
