import { useRef, useState, type CSSProperties } from 'react';
import {
  Heart,
  Sparkles,
  Cake,
  Layers,
  Package,
  AlertTriangle,
  TrendingUp,
  Check,
  X,
  Watch,
  Brain,
  Eye,
  ShoppingBag,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { CopilotNudge } from '@/types';
import { getCustomerById, getProductBySku } from '@/data/mocks';
import { formatBRL } from '@/utils/format';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { useAppDispatch } from '@/app/store/hooks';
import {
  acceptNudge as acceptNudgeAction,
  rejectNudge as rejectNudgeAction,
  dismissNudge,
} from '@/app/store/slices/copilotSlice';
import { selectCustomer as setActiveCustomer } from '@/app/store/slices/customerSlice';
import { NudgeAvatar } from './NudgeAvatar';

type NudgeKind = CopilotNudge['type'];

interface Props {
  nudge: CopilotNudge;
  /** Mobile habilita swipe horizontal · desktop ignora gestos. */
  enableSwipe?: boolean;
  /** Cards de Apple Watch ficam mais compactos e com glyph dedicado. */
  variant?: 'standard' | 'watch';
}

const TYPE_META: Record<
  NudgeKind,
  {
    label: string;
    icon: typeof Sparkles;
    tone: 'coral' | 'gold' | 'rose' | 'amber' | 'plum' | 'slate' | 'sky' | 'teal';
    /** Papel default do Agente IA (sobrescrito por nudge.agentRole se vier do mock). */
    defaultRole: string;
  }
> = {
  'vip-arrived': { label: 'VIP no salão', icon: Sparkles, tone: 'gold', defaultRole: 'CDP Sentinel' },
  'wishlist-match': { label: 'Wishlist match', icon: Heart, tone: 'rose', defaultRole: 'Wishlist Engine' },
  birthday: { label: 'Aniversário', icon: Cake, tone: 'plum', defaultRole: 'Clienteling Antecipatório' },
  combination: { label: 'Combinação', icon: Layers, tone: 'coral', defaultRole: 'Estilo IA' },
  'cross-sell': { label: 'Cross-sell', icon: Package, tone: 'amber', defaultRole: 'Sacola Engine' },
  risk: { label: 'Risco', icon: AlertTriangle, tone: 'slate', defaultRole: 'Sentinela de Risco' },
  'intent-prediction': { label: 'Intenção prevista', icon: Brain, tone: 'coral', defaultRole: 'Visão 360°' },
  'vitrine-trigger': { label: 'Vitrine reagiu', icon: Eye, tone: 'sky', defaultRole: 'Vitrine Vision' },
  'bundle-suggestion': { label: 'Bundle sugerido', icon: ShoppingBag, tone: 'teal', defaultRole: 'Sacola Inteligente' },
  'identity-merge': { label: 'Identidade unificada', icon: Users, tone: 'plum', defaultRole: 'Cross-Channel Unifier' },
};

const TONE_BG: Record<string, string> = {
  coral: 'bg-coral-50 text-coral-500',
  gold: 'bg-gold/15 text-gold',
  rose: 'bg-rose-50 text-rose-500',
  amber: 'bg-amber-50 text-amber-700',
  plum: 'bg-purple-50 text-purple-700',
  slate: 'bg-ink-1 text-ink-6',
  sky: 'bg-sky-50 text-sky-700',
  teal: 'bg-teal-50 text-teal-700',
};

const MARGIN_LABEL = {
  optimal: { label: 'Margem ótima', cls: 'bg-emerald-50 text-emerald-700' },
  good: { label: 'Margem boa', cls: 'bg-emerald-50/70 text-emerald-700/90' },
  attention: { label: 'Margem atenção', cls: 'bg-amber-50 text-amber-700' },
} as const;

/**
 * Estima oportunidade financeira do nudge.
 *
 * Heurísticas (mock — backend real virá do Pricing engine):
 *   wishlist-match / cross-sell → preço do produto sugerido
 *   vip-arrived                → ticket médio histórico (LTV / orders)
 *   birthday                   → ticket médio × 1.4 (presente)
 *   combination                → produto sugerido × 1.6 (par)
 *   risk                       → 0 (alerta não é venda)
 */
function estimateOpportunity(nudge: CopilotNudge): number | null {
  if (nudge.valueHint) return nudge.valueHint;

  const product = getProductBySku(nudge.productSku);
  const customer = getCustomerById(nudge.customerId);
  const avgTicket =
    customer && customer.totalOrders > 0
      ? Math.round(customer.totalLTV / customer.totalOrders)
      : null;

  switch (nudge.type) {
    case 'wishlist-match':
    case 'cross-sell':
      return product?.price ?? avgTicket;
    case 'vip-arrived':
    case 'intent-prediction':
    case 'identity-merge':
      return avgTicket;
    case 'birthday':
      return avgTicket ? Math.round(avgTicket * 1.4) : null;
    case 'combination':
    case 'bundle-suggestion':
      return product ? Math.round(product.price * 1.6) : avgTicket;
    case 'vitrine-trigger':
      return product?.price ?? (avgTicket ? Math.round(avgTicket * 0.8) : null);
    case 'risk':
    default:
      return null;
  }
}

/**
 * Card refinado de nudge · usado pelo CopilotPanel.
 *
 * Princípios visuais (Bella + Eliza + Ju):
 * 1. Cliente como protagonista (avatar + nome em serif + tier ring)
 * 2. Oportunidade financeira em destaque (Ju · "vendemos decisão, não letrinhas")
 * 3. Preview da peça (Bella · joia se vê, não se lê)
 * 4. CTA primário GRANDE + ghost menor (Aceitar é decisão fácil)
 * 5. Swipe gestures opcionais em mobile (Eliza · pointer events nativos · sem deps extra)
 *
 * Acessibilidade WCAG 2.2 AA:
 * - role="article" + aria-labelledby
 * - botões com label completo
 * - prefers-reduced-motion respeitado
 * - swipe NÃO é o único caminho · sempre há botões
 */
export function NudgeCard({ nudge, enableSwipe = false, variant = 'standard' }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tp = useTenantPath();
  const ref = useRef<HTMLElement | null>(null);
  const [drag, setDrag] = useState<number>(0);
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null);

  const meta = TYPE_META[nudge.type];
  const Icon = meta.icon;

  const customer = getCustomerById(nudge.customerId);
  const product = getProductBySku(nudge.productSku);
  const opportunity = estimateOpportunity(nudge);
  const isWatch = variant === 'watch';

  const headerName = customer?.name ?? nudge.title;
  const subtitle = customer
    ? `${customer.tier === 'diamond' ? 'Diamond' : customer.tier === 'gold' ? 'Gold' : customer.tier === 'silver' ? 'Silver' : 'Standard'} · LTV ${formatBRL(customer.totalLTV)}`
    : nudge.title;

  function handleAccept() {
    setExiting('right');
    dispatch(acceptNudgeAction(nudge.id));
    if (customer) {
      dispatch(setActiveCustomer(customer));
      navigate(tp(`/cliente/${customer.id}`));
      toast.success(`Indo para ${customer.name}`, {
        description: opportunity ? `Oportunidade estimada · ${formatBRL(opportunity)}` : undefined,
      });
    } else if (product) {
      navigate(tp(`/produto/${product.sku}`));
      toast.success(`Abrindo ${product.name}`);
    } else {
      toast.success('Nudge aceito · ação registrada');
    }
  }

  function handleReject() {
    setExiting('left');
    dispatch(rejectNudgeAction({ id: nudge.id, reason: 'manual' }));
    toast.info('Nudge rejeitado · feedback registrado para o modelo');
  }

  function handleDismiss() {
    setExiting('left');
    dispatch(dismissNudge(nudge.id));
  }

  // Swipe (mobile/tablet) ─ pointer events nativos, sem framer-motion.
  const startX = useRef<number | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    if (!enableSwipe) return;
    if (e.pointerType === 'mouse') return;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    setDrag(Math.max(-200, Math.min(200, dx)));
  }
  function onPointerUp() {
    if (startX.current === null) return;
    if (drag > 90) handleAccept();
    else if (drag < -90) handleReject();
    else setDrag(0);
    startX.current = null;
  }

  const transformStyle: CSSProperties = exiting
    ? {
        transform: `translateX(${exiting === 'right' ? 420 : -420}px) rotate(${exiting === 'right' ? 6 : -6}deg)`,
        opacity: 0,
        transition: 'transform 220ms ease-out, opacity 220ms ease-out',
        pointerEvents: 'none',
      }
    : drag !== 0
      ? {
          transform: `translateX(${drag}px) rotate(${drag * 0.04}deg)`,
          transition: startX.current !== null ? 'none' : 'transform 200ms ease-out',
        }
      : {};

  const swipeHint =
    drag > 60
      ? { side: 'right' as const, label: 'Aceitar', tone: 'bg-emerald-500' }
      : drag < -60
        ? { side: 'left' as const, label: 'Rejeitar', tone: 'bg-rose-500' }
        : null;

  // Watch lane ─ visualização condensada e refinada (não preto cheio).
  if (isWatch) {
    return (
      <article
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-ink-7 to-ink-6 text-white/95 shadow-sm relative overflow-hidden"
        aria-label={`Notificação no Apple Watch · ${headerName}`}
      >
        <span
          className="absolute inset-y-0 left-0 w-1 bg-coral-500 animate-pulse-coral"
          aria-hidden="true"
        />
        <Watch className="w-4 h-4 flex-shrink-0 text-coral-300" aria-hidden="true" />
        <NudgeAvatar
          customerName={customer?.name}
          tier={customer?.tier}
          size="sm"
          pulse={nudge.urgency === 'high'}
        />
        <div className="min-w-0 flex-1">
          <div className="font-serif font-semibold text-[13px] truncate">{headerName}</div>
          <div className="text-[11px] text-white/70 truncate">{nudge.body}</div>
        </div>
        <button
          onClick={handleAccept}
          className="hidden md:inline-flex items-center gap-1 text-[11px] uppercase tracking-cta font-bold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 transition-colors"
          aria-label={`Atender ${headerName}`}
        >
          Atender
        </button>
      </article>
    );
  }

  return (
    <article
      ref={(el) => {
        ref.current = el;
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={transformStyle}
      className={clsx(
        'group relative bg-white rounded-2xl border border-border/70 shadow-sm hover:shadow-md transition-shadow',
        'overflow-hidden touch-pan-y motion-reduce:transition-none',
      )}
      aria-labelledby={`nudge-title-${nudge.id}`}
    >
      {/* Indicador de urgência (lateral · não preto cheio) */}
      {nudge.urgency === 'high' && (
        <span
          className="absolute inset-y-0 left-0 w-1 bg-coral-500 animate-pulse-coral"
          aria-hidden="true"
        />
      )}

      {/* Hint de swipe (visível só durante drag) */}
      {swipeHint && (
        <div
          className={clsx(
            'absolute inset-y-0 flex items-center px-4 z-10 pointer-events-none text-white text-xs uppercase tracking-cta font-bold',
            swipeHint.side === 'right' ? 'left-0' : 'right-0',
            swipeHint.tone,
          )}
        >
          {swipeHint.side === 'right' ? <Check className="w-4 h-4 mr-1.5" /> : <X className="w-4 h-4 mr-1.5" />}
          {swipeHint.label}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Linha 1 · tipo do nudge + papel do Agente IA + dismiss */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-cta font-bold flex-shrink-0',
                TONE_BG[meta.tone],
              )}
            >
              <Icon className="w-3 h-3" aria-hidden="true" />
              {meta.label}
            </span>
            <span
              className="text-[9px] uppercase tracking-cta text-ink-4 truncate"
              title={`Agente IA · ${nudge.agentRole ?? meta.defaultRole}`}
            >
              · {nudge.agentRole ?? meta.defaultRole}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 inline-flex items-center justify-center rounded-full text-ink-4 hover:bg-ink-1 hover:text-ink-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 transition-colors"
            aria-label="Dispensar nudge"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Linha 2 · cliente protagonista (ou produto se headless) */}
        <div className="flex items-start gap-3">
          <NudgeAvatar
            customerName={customer?.name}
            tier={customer?.tier}
            size="lg"
            pulse={nudge.urgency === 'high'}
          />
          <div className="min-w-0 flex-1">
            <h3
              id={`nudge-title-${nudge.id}`}
              className="font-serif text-[16px] leading-tight text-ink-7 truncate"
            >
              {headerName}
            </h3>
            <div className="text-[11px] text-ink-5 mt-0.5 truncate">{subtitle}</div>
          </div>
        </div>

        {/* Linha 3 · oportunidade em destaque */}
        {opportunity !== null && (
          <div className="flex items-end justify-between gap-3 pt-1">
            <div>
              <div className="text-[10px] uppercase tracking-cta font-bold text-ink-5">
                Ticket potencial
              </div>
              <div className="font-serif text-[22px] leading-none text-coral-500 font-semibold mt-0.5">
                +{formatBRL(opportunity)}
              </div>
            </div>
            {nudge.margin && (
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase tracking-cta font-bold flex-shrink-0',
                  MARGIN_LABEL[nudge.margin].cls,
                )}
              >
                <TrendingUp className="w-3 h-3" aria-hidden="true" />
                {MARGIN_LABEL[nudge.margin].label}
              </span>
            )}
          </div>
        )}

        {/* Linha 4 · body + preview da peça */}
        <div className="flex items-start gap-3">
          {product && (
            <div
              className="w-14 h-14 rounded-lg overflow-hidden bg-ink-1 flex-shrink-0 ring-1 ring-border"
              aria-hidden="true"
            >
              <img
                src={product.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <p className="text-[13px] text-ink-6 leading-snug line-clamp-3 flex-1">{nudge.body}</p>
        </div>

        {/* Linha 5 · ações (CTA primary GRANDE + ghost) */}
        <div className="flex items-stretch gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-coral-500 hover:bg-coral-400 active:opacity-90 text-white font-bold text-[13px] uppercase tracking-cta shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 focus-visible:ring-offset-2 transition-all"
            aria-label={`Aceitar e agir · ${headerName}`}
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Aceitar e agir
          </button>
          <button
            onClick={handleReject}
            className="h-11 px-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white hover:bg-ink-1 text-ink-6 font-semibold text-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 transition-colors"
            aria-label="Rejeitar nudge"
            title="Não é relevante agora"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Rejeitar</span>
          </button>
        </div>
      </div>
    </article>
  );
}
