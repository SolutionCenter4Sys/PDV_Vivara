import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  Layers,
  Gift,
  Stamp,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { getSmartBagSuggestions, type SmartBagSuggestion } from '@/data/mocks';
import { formatBRL } from '@/utils/format';

/**
 * Sacola Inteligente · cross-sell contextual em tempo real
 *
 * Mapeia 1-3 sugestões geradas por `getSmartBagSuggestions(cart, customer)`
 * e expõe cada uma como ação 1-tap (adicionar à sacola, ver peça, agregar serviço).
 *
 * Cada sugestão carrega:
 *  - kind (companion-piece | margin-bundle | gift-add-on | service-upsell)
 *  - rationale (motivo curto)
 *  - marginUpliftPct (uplift estimado)
 *  - agentRole (qual papel do Agente IA detectou)
 *
 * Variantes:
 *  - `variant="full"`   → cards ricos com imagem (CartPage)
 *  - `variant="compact"`→ lista com 1 linha por sugestão (SalesBagBar inline)
 */

const KIND_META: Record<
  SmartBagSuggestion['kind'],
  { label: string; icon: typeof Sparkles; tone: string }
> = {
  'companion-piece': { label: 'Peça-irmã', icon: Layers, tone: 'bg-coral-50 text-coral-500' },
  'margin-bundle': { label: 'Bundle margem', icon: ShoppingBag, tone: 'bg-teal-50 text-teal-700' },
  'gift-add-on': { label: 'Add-on presente', icon: Gift, tone: 'bg-rose-50 text-rose-500' },
  'service-upsell': { label: 'Serviço', icon: Stamp, tone: 'bg-amber-50 text-amber-700' },
};

interface Props {
  variant?: 'full' | 'compact';
  className?: string;
  /** Limita o número de sugestões exibidas (default = 3 para full, 2 para compact). */
  limit?: number;
}

export function SmartBagSuggestions({ variant = 'full', className, limit }: Props) {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const cart = usePosStore((s) => s.cart);
  const activeCustomer = usePosStore((s) => s.activeCustomer);
  const addToCart = usePosStore((s) => s.addToCart);

  const suggestions = useMemo(
    () => getSmartBagSuggestions(cart, activeCustomer ?? undefined),
    [cart, activeCustomer],
  );

  const visible = suggestions.slice(0, limit ?? (variant === 'compact' ? 2 : 3));
  if (visible.length === 0) return null;

  function handleAdd(s: SmartBagSuggestion) {
    if (s.kind === 'service-upsell') {
      toast.success('Serviço de gravação anexado à venda', {
        description: '+R$ 89 · 3-5 dias úteis · margem 92%',
      });
      return;
    }
    if (s.product) {
      addToCart(s.product);
      toast.success(`Adicionado · ${s.product.name}`, {
        description: `Sacola Inteligente · uplift +${s.marginUpliftPct}%`,
      });
    }
  }

  if (variant === 'compact') {
    return (
      <section
        className={clsx(
          'border-l-4 border-coral-500 bg-coral-50/40 p-3 rounded-md',
          className,
        )}
        aria-labelledby="smart-bag-h-compact"
      >
        <header className="flex items-center justify-between gap-2 mb-2">
          <h3
            id="smart-bag-h-compact"
            className="text-[10px] uppercase tracking-cta font-bold text-coral-500 inline-flex items-center gap-1"
          >
            <Sparkles size={11} aria-hidden="true" />
            Sacola Inteligente · Agente IA
          </h3>
          <span className="text-[9px] uppercase tracking-cta text-ink-4">
            {visible.length} sugest{visible.length === 1 ? 'ão' : 'ões'}
          </span>
        </header>
        <ul className="space-y-1.5" role="list">
          {visible.map((s) => {
            const Icon = KIND_META[s.kind].icon;
            return (
              <li key={s.id} className="flex items-center gap-2 text-[11px]">
                <span
                  className={clsx(
                    'inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0',
                    KIND_META[s.kind].tone,
                  )}
                  aria-hidden="true"
                >
                  <Icon size={11} />
                </span>
                <span className="flex-1 truncate text-ink-7 font-medium">
                  {s.product?.name ?? 'Gravação personalizada'}
                </span>
                <button
                  type="button"
                  onClick={() => handleAdd(s)}
                  className="text-[10px] uppercase tracking-cta font-bold text-coral-500 hover:text-coral-600"
                  aria-label={`Adicionar ${s.product?.name ?? 'serviço'}`}
                >
                  + Sacola
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <section
      className={clsx('card p-4 md:p-5 border-l-4 border-coral-500', className)}
      aria-labelledby="smart-bag-h"
    >
      <header className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1 inline-flex items-center gap-1.5">
            <Sparkles size={11} aria-hidden="true" />
            Sacola Inteligente · cross-sell em tempo real
          </div>
          <h2
            id="smart-bag-h"
            className="font-serif text-xl font-semibold text-ink-7 inline-flex items-center gap-2"
          >
            Agente IA sugere {visible.length} {visible.length === 1 ? 'peça' : 'peças'} para fechar a venda
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-cta text-ink-4 font-bold inline-flex items-center gap-1">
          <TrendingUp size={11} aria-hidden="true" />
          Uplift médio +{Math.round(visible.reduce((s, x) => s + x.marginUpliftPct, 0) / visible.length)}%
        </span>
      </header>
      <ul role="list" className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {visible.map((s) => {
          const Icon = KIND_META[s.kind].icon;
          return (
            <li key={s.id} className="border border-border bg-white p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-cta font-bold',
                    KIND_META[s.kind].tone,
                  )}
                >
                  <Icon size={11} aria-hidden="true" />
                  {KIND_META[s.kind].label}
                </span>
                <span className="tag bg-success/15 text-success">+{s.marginUpliftPct}%</span>
              </div>
              {s.product ? (
                <div className="aspect-square bg-ink-1 mb-2">
                  <img
                    src={s.product.imageUrl}
                    alt={s.product.imageAlt ?? s.product.name}
                    className="w-full h-full object-contain p-2"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-amber-50 mb-2 flex items-center justify-center">
                  <Stamp size={36} className="text-amber-700" aria-hidden="true" />
                </div>
              )}
              <div className="font-serif text-[14px] font-semibold text-ink-7 leading-tight mb-1 flex-1">
                {s.product?.name ?? 'Gravação personalizada'}
              </div>
              <div className="font-mono text-[12px] text-coral-500 font-bold mb-2">
                {s.product ? formatBRL(s.product.price) : '+ R$ 89,00'}
              </div>
              <div className="text-[11px] text-ink-5 leading-snug border-t border-border-light pt-2 mb-2">
                <strong className="text-ink-7">{s.agentRole}:</strong> {s.rationale}
              </div>
              <div className="flex gap-1.5">
                {s.product && (
                  <button
                    type="button"
                    onClick={() => navigate(tp(`/produto/${s.product!.sku}`))}
                    className="btn-tertiary p-0 flex-1 text-[10px] inline-flex items-center justify-center gap-1"
                  >
                    Detalhe
                    <ChevronRight size={10} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAdd(s)}
                  className="btn-secondary btn-sm flex-1 text-[10px] inline-flex items-center justify-center gap-1"
                  aria-label={`Adicionar ${s.product?.name ?? 'serviço'} à sacola`}
                >
                  <ShoppingBag size={11} aria-hidden="true" />
                  Sacola
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
