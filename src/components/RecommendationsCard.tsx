import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, ChevronRight, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useAppSelector } from '@app/store/hooks';
import { products as allProducts } from '@/data/mocks';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { usePosStore } from '@/store/usePosStore';
import { formatBRL } from '@/utils/format';
import type { Product } from '@/types';

/**
 * EP-03-F3-FE-01 · Recomendações IA Top 3 com motivo (rationale).
 *
 * Algoritmo determinístico mock baseado em:
 *  - tier do cliente
 *  - histórico (timeline cross-channel)
 *  - itens da wishlist (boost se categoria coincide)
 *  - margem da peça
 *
 * Em produção · Salesforce Einstein + custom MMM Vivara.
 */

interface Reco {
  product: Product;
  score: number;
  rationale: string;
  marginUplift: number; // ganho percentual estimado vs ticket médio
}

function pickRecos(customerTier: 'diamond' | 'gold' | 'silver' | 'standard' | undefined, wishlistCategoryHints: string[]): Reco[] {
  const minPrice = customerTier === 'diamond' ? 2000 : customerTier === 'gold' ? 800 : 250;
  const maxPrice = customerTier === 'diamond' ? 25000 : customerTier === 'gold' ? 8000 : 3500;
  const inRange = allProducts.filter((p) => p.price >= minPrice && p.price <= maxPrice);

  const ranked = inRange
    .map<Reco>((p) => {
      const wishlistMatch = wishlistCategoryHints.includes(p.category) ? 0.25 : 0;
      const tagBoost = p.tag === 'limitada' ? 0.18 : p.tag === 'novo' ? 0.1 : 0;
      const marginBoost = p.price > 5000 ? 0.15 : p.price > 1500 ? 0.08 : 0.02;
      const stockPenalty = p.stockNetwork < 3 ? -0.1 : 0;
      const baseScore = 0.5;
      const score = Number(
        (baseScore + wishlistMatch + tagBoost + marginBoost + stockPenalty).toFixed(2),
      );
      const reasons: string[] = [];
      if (wishlistMatch > 0) reasons.push('cliente já tem peças similares na wishlist');
      if (p.tag === 'limitada') reasons.push('coleção limitada · escassez gera urgência');
      if (p.tag === 'novo') reasons.push('lançamento da semana · halo effect');
      if (p.price > 5000) reasons.push('aderência ao ticket médio do tier');
      if (reasons.length === 0) reasons.push('alta probabilidade de cross-sell pelo histórico');
      return {
        product: p,
        score,
        rationale: reasons.join(' · '),
        marginUplift: Math.round(marginBoost * 200),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return ranked;
}

interface Props {
  variant?: 'full' | 'compact';
  className?: string;
}

export function RecommendationsCard({ variant = 'full', className }: Props) {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const customer = useAppSelector((s) => s.customer.active);
  const wishlists = useAppSelector((s) => s.wishlist.lists);
  const { addToCart } = usePosStore();

  const recos = useMemo(() => {
    const cats = customer
      ? wishlists
          .filter((l) => l.customerId === customer.id)
          .flatMap((l) =>
            l.items
              .map((i) => allProducts.find((p) => p.id === i.productId)?.category)
              .filter(Boolean) as string[],
          )
      : [];
    return pickRecos(customer?.tier, cats);
  }, [customer, wishlists]);

  if (variant === 'compact') {
    return (
      <section
        className={clsx('card p-3 border-l-4 border-coral-500 bg-coral-50/40', className)}
        aria-labelledby="reco-h-compact"
      >
        <header className="flex items-center justify-between gap-2 mb-2">
          <h3
            id="reco-h-compact"
            className="text-[11px] uppercase tracking-cta font-bold text-coral-500 inline-flex items-center gap-1"
          >
            <Sparkles size={12} aria-hidden="true" />
            IA · Top 3
          </h3>
          <span className="text-[9px] uppercase tracking-cta text-ink-4">Einstein</span>
        </header>
        <ul className="space-y-1.5" role="list">
          {recos.map((r, idx) => (
            <li key={r.product.id} className="flex items-center gap-2 text-[11px]">
              <span className="font-mono text-coral-500 font-bold w-4">{idx + 1}.</span>
              <button
                type="button"
                onClick={() => navigate(tp(`/produto/${r.product.sku}`))}
                className="flex-1 text-left truncate hover:text-coral-500 transition"
              >
                {r.product.name}
              </button>
              <span className="font-mono text-[10px] text-ink-5">+{r.marginUplift}%</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      className={clsx('card p-4 border-l-4 border-coral-500', className)}
      aria-labelledby="reco-h"
    >
      <header className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h2
          id="reco-h"
          className="font-serif text-xl font-semibold inline-flex items-center gap-2"
        >
          <Sparkles size={18} aria-hidden="true" className="text-coral-500" />
          Recomendações IA · Top 3
        </h2>
        <span className="text-[10px] uppercase tracking-cta text-ink-4 font-bold inline-flex items-center gap-1">
          <TrendingUp size={11} aria-hidden="true" />
          {customer ? `${customer.tier} · ${customer.name.split(' ')[0]}` : 'sem cliente'}
        </span>
      </header>
      <ul role="list" className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {recos.map((r, idx) => (
          <li key={r.product.id} className="border border-border bg-white p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-cta font-bold text-coral-500">
                #{idx + 1} · score {(r.score * 100).toFixed(0)}
              </span>
              <span className="tag bg-success/15 text-success">+{r.marginUplift}% ticket</span>
            </div>
            <div className="aspect-square bg-ink-1 mb-2">
              {r.product.imageUrl && (
                <img
                  src={r.product.imageUrl}
                  alt={r.product.name}
                  className="w-full h-full object-contain p-2"
                  loading="lazy"
                />
              )}
            </div>
            <div className="font-serif text-[14px] font-semibold text-ink-7 leading-tight mb-1 flex-1">
              {r.product.name}
            </div>
            <div className="font-mono text-[12px] text-coral-500 font-bold mb-2">
              {formatBRL(r.product.price)}
            </div>
            <div className="text-[11px] text-ink-5 leading-snug border-t border-border-light pt-2 mb-2">
              <strong className="text-ink-7">Por quê:</strong> {r.rationale}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => navigate(tp(`/produto/${r.product.sku}`))}
                className="btn-tertiary p-0 flex-1 text-[10px] inline-flex items-center justify-center gap-1"
              >
                Detalhe
                <ChevronRight size={10} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  addToCart(r.product);
                  toast.success(`Adicionado · ${r.product.name}`);
                }}
                className="btn-secondary btn-sm flex-1 text-[10px] inline-flex items-center justify-center gap-1"
                aria-label={`Adicionar ${r.product.name} ao carrinho`}
              >
                <ShoppingBag size={11} aria-hidden="true" />
                Carrinho
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
