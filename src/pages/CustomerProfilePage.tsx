import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MessageCircle,
  Calendar,
  Sparkles,
  Heart,
  ShoppingBag,
  Phone,
  Mail,
  UserX,
  Link2,
  Activity,
  Globe,
  Smartphone,
  Store,
  Package,
  CreditCard,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react';
import {
  customers,
  getCustomerById,
  getCustomerIntentBriefing,
  getProductById,
  orders,
  getProductBySku,
} from '@/data/mocks';
import { customerInteractions, loyaltyAccounts } from '@/data/extendedMocks';
import type { CustomerInteraction } from '@/data/extendedMocks';
import { ProductCard } from '@/components/ProductCard';
import { CustomerCard } from '@/components/CustomerCard';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CustomerProfileSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { IdentityMergeDialog } from '@/components/IdentityMergeDialog';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { daysUntil, formatBRL, formatRelativeDate, maskCpf, tierLabel } from '@/utils/format';
import clsx from 'clsx';

const CHANNEL_ICON: Record<CustomerInteraction['channel'], typeof Globe> = {
  pdv: Store,
  ecommerce: Globe,
  whatsapp: MessageCircle,
  app: Smartphone,
  sac: Mail,
  instagram: Heart,
};

const CHANNEL_COLOR: Record<CustomerInteraction['channel'], string> = {
  pdv: 'bg-coral-500 text-white',
  ecommerce: 'bg-ink-7 text-white',
  whatsapp: 'bg-success/20 text-success',
  app: 'bg-warning-light text-warning',
  sac: 'bg-ink-2 text-ink-7',
  instagram: 'bg-gold/20 text-gold',
};

export function CustomerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tp = useTenantPath();
  const {
    selectCustomer,
    addToCart,
    removeFromCart,
    updateQuantity,
    activeCustomer,
    cart,
    cartTotal,
    cartCount,
  } = usePosStore();
  const customer = getCustomerById(id);
  const [loading, setLoading] = useState(true);
  const [mergeOpen, setMergeOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(t);
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 reveal">
        <Breadcrumb
          items={[
            { label: 'Clientes', to: tp('/') },
            { label: 'Carregando…' },
          ]}
        />
        <CustomerProfileSkeleton />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-8 reveal">
        <Breadcrumb items={[{ label: 'Clientes', to: tp('/') }, { label: 'Não encontrado' }]} />
        <EmptyState
          illustration="search"
          title="Cliente não encontrado"
          description="Pode ser uma jornada nova. Cadastre o cliente capturando CPF + opt-in LGPD ou volte e refaça a busca."
          primaryAction={
            <button onClick={() => navigate(tp('/'))} className="btn-primary">
              <UserX size={14} aria-hidden="true" /> Voltar e buscar novamente
            </button>
          }
        />
      </div>
    );
  }

  const wishlistProducts = customer.wishlist.map(id => getProductById(id)).filter(Boolean);
  const customerOrders = orders.filter(o => o.customer?.id === customer.id);
  const dToBirthday = daysUntil(customer.birthday);
  const interactions = customerInteractions
    .filter(i => i.customerId === customer.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const loyalty = loyaltyAccounts[customer.id];

  const isThisCustomerActive = activeCustomer?.id === customer.id;
  const sessionItems = isThisCustomerActive ? cart : [];
  const sessionCount = isThisCustomerActive ? cartCount() : 0;
  const sessionTotal = isThisCustomerActive ? cartTotal() : 0;

  const handleStartAttendance = () => {
    selectCustomer(customer);
    navigate(tp('/catalogo'));
  };

  const handleAddWishlistItem = (productId: string) => {
    const product = getProductById(productId);
    if (!product) return;
    if (!isThisCustomerActive) {
      selectCustomer(customer);
    }
    addToCart(product);
    toast.success('Peça adicionada à sacola', {
      description: `${product.name} vinculada à venda de ${customer.name}.`,
    });
  };

  const handleGoToBag = () => navigate(tp('/carrinho'));
  const handleGoToPayment = () => navigate(tp('/pagamento'));

  const tierBadge = clsx(
    'tag',
    customer.tier === 'diamond' ? 'bg-ink-7 text-white' :
    customer.tier === 'gold' ? 'bg-gold text-white' :
    customer.tier === 'silver' ? 'bg-ink-3 text-ink-7' : 'bg-ink-2 text-ink-7'
  );

  const otherCustomers = customers.filter(c => c.id !== customer.id && c.tier === 'diamond').slice(0, 3);

  return (
    <div className="space-y-10 reveal">
      <Breadcrumb
        items={[
          { label: 'Clientes', to: tp('/') },
          { label: customer.name },
        ]}
      />
      <button onClick={() => navigate(-1)} className="btn-tertiary self-start p-0">
        <ArrowLeft size={14} aria-hidden="true" /> Voltar
      </button>

      {/* Header 360 */}
      <header className="grid grid-cols-1 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] gap-4 md:gap-6 items-center bg-coral-50 border border-coral-200 p-5 md:p-6">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-ink-7 text-white flex items-center justify-center font-serif text-3xl md:text-4xl font-semibold flex-shrink-0">
          {customer.name.split(' ').slice(0, 2).map(p => p.charAt(0)).join('')}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={tierBadge}>{tierLabel(customer.tier)}</span>
            {dToBirthday !== null && dToBirthday >= 0 && dToBirthday <= 30 && (
              <span className="tag bg-coral-500 text-white animate-pulse-coral">
                <Calendar size={10} className="inline mr-1" aria-hidden="true" />
                Aniversário em {dToBirthday} dia{dToBirthday === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <h1 className="heading-serif text-fluid-h1 mb-2 break-words">{customer.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-5">
            <span className="flex items-center gap-1 min-w-0"><Mail size={11} aria-hidden="true" /> <span className="truncate">{customer.email}</span></span>
            <span className="flex items-center gap-1"><Phone size={11} aria-hidden="true" /> {customer.phone}</span>
            <span>· CPF {maskCpf(customer.cpf)}</span>
            <span>· {customer.city}</span>
          </div>
        </div>
        <div className="flex flex-row md:col-span-2 lg:col-span-1 lg:flex-col gap-2 md:flex-wrap">
          <button onClick={handleStartAttendance} className="btn-primary flex-1 lg:flex-none">
            <ShoppingBag size={14} aria-hidden="true" /> Iniciar atendimento
          </button>
          {customer.optInWhatsapp && (
            <button className="btn-secondary btn-sm flex-1 lg:flex-none">
              <MessageCircle size={12} aria-hidden="true" /> WhatsApp
            </button>
          )}
        </div>
      </header>

      {/* KPIs do cliente · agora com fidelidade */}
      <section className="grid grid-cols-2 lg:grid-cols-5 border border-border">
        {[
          { label: 'LTV total', value: formatBRL(customer.totalLTV), highlight: 'coral' },
          { label: 'Pedidos', value: customer.totalOrders, highlight: 'ink' },
          {
            label: 'Pontos fidelidade',
            value: loyalty ? loyalty.points.toLocaleString('pt-BR') : '—',
            highlight: 'gold',
          },
          { label: 'Wishlist', value: customer.wishlist.length, highlight: 'ink' },
          {
            label: 'LGPD · LI',
            value: customer.optInLI ? 'Ativo' : 'Inativo',
            highlight: customer.optInLI ? 'success' : 'ink',
          },
        ].map(kpi => (
          <div key={kpi.label} className="p-4 md:p-5 border-r border-b border-border last:border-r-0">
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-2">
              {kpi.label}
            </div>
            <div
              className={clsx(
                'font-serif text-2xl lg:text-3xl font-semibold leading-tight',
                kpi.highlight === 'coral' ? 'text-coral-500' :
                kpi.highlight === 'gold' ? 'text-gold' :
                kpi.highlight === 'success' ? 'text-success' : 'text-ink-7'
              )}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </section>

      {/* Briefing Agente IA · intent prediction · 5s de leitura */}
      {(() => {
        const briefing = getCustomerIntentBriefing(customer);
        const anchor = briefing.anchorSku ? getProductBySku(briefing.anchorSku) : undefined;
        const confidenceTone =
          briefing.confidence >= 85
            ? 'text-success bg-success/15'
            : briefing.confidence >= 70
              ? 'text-coral-500 bg-coral-50'
              : 'text-amber-700 bg-amber-50';
        return (
          <section
            aria-label="Briefing pré-atendimento gerado pelo Agente IA"
            className="card p-5 md:p-6 border-2 border-coral-200 bg-gradient-to-br from-white via-coral-50 to-white"
          >
            <header className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-1 flex items-center gap-2">
                  <Sparkles size={12} aria-hidden="true" />
                  Agente IA · briefing pré-atendimento
                </div>
                <h2 className="font-serif text-xl md:text-2xl font-semibold text-ink-7 leading-tight">
                  {briefing.headline}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase tracking-cta font-bold',
                    confidenceTone,
                  )}
                  aria-label={`Confiança do modelo · ${briefing.confidence}%`}
                >
                  <Activity size={11} aria-hidden="true" />
                  {briefing.confidence}% confiança
                </span>
                <span className="text-[9px] uppercase tracking-cta text-ink-5">
                  {briefing.agentRole}
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
              <div>
                <div className="text-[11px] uppercase tracking-label font-bold text-ink-5 mb-1.5">
                  Próxima ação sugerida
                </div>
                <p className="text-sm text-ink-7 leading-relaxed mb-3">
                  {briefing.nextAction}
                </p>

                <div className="text-[11px] uppercase tracking-label font-bold text-ink-5 mb-1.5">
                  Sinais detectados
                </div>
                <ul className="text-[12px] text-ink-6 space-y-1" role="list">
                  {briefing.signals.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span aria-hidden="true" className="text-coral-500">·</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {anchor && (
                <div className="border border-border bg-white p-3 max-w-[200px]">
                  <div className="text-[9px] uppercase tracking-cta font-bold text-coral-500 mb-1">
                    Peça-âncora sugerida
                  </div>
                  <div className="aspect-square bg-ink-1 mb-2">
                    <img
                      src={anchor.imageUrl}
                      alt={anchor.imageAlt ?? anchor.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="font-serif text-[12px] font-semibold text-ink-7 leading-tight mb-1 line-clamp-2">
                    {anchor.name}
                  </div>
                  <div className="font-mono text-[11px] text-coral-500 font-bold">
                    {formatBRL(anchor.price)}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* Sacola da venda · sessão de atendimento ativa */}
      <section
        aria-label="Sacola da venda em andamento"
        className={clsx(
          'card p-5 md:p-6 border-2 transition-colors',
          isThisCustomerActive && sessionCount > 0
            ? 'bg-coral-50 border-coral-500'
            : 'bg-ink-1 border-border',
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-1 flex items-center gap-2">
              <ShoppingBag size={12} aria-hidden="true" />
              Sacola da venda · sessão de atendimento
            </div>
            <h2 className="heading-serif text-fluid-h3">
              {isThisCustomerActive && sessionCount > 0 ? (
                <>
                  {sessionCount} {sessionCount === 1 ? 'peça' : 'peças'} ·{' '}
                  <em className="text-coral-500">{formatBRL(sessionTotal)}</em>
                </>
              ) : isThisCustomerActive ? (
                <>Sessão aberta para <em className="text-coral-500">{customer.name.split(' ')[0]}</em></>
              ) : (
                <>Inicie o atendimento para montar a sacola</>
              )}
            </h2>
            <p className="text-[12px] text-ink-5 mt-1">
              {isThisCustomerActive && sessionCount > 0
                ? 'Itens da sessão ficam vinculados à NFC-e, fidelidade e CRM do cliente ao confirmar o pagamento.'
                : isThisCustomerActive
                  ? 'Adicione peças pelo catálogo, scan, wishlist ou Endless Aisle. Tudo entra automaticamente nesta sacola.'
                  : 'Clique em "Iniciar atendimento" para vincular o cliente e habilitar a sacola.'}
            </p>
          </div>
          {!isThisCustomerActive && (
            <button onClick={handleStartAttendance} className="btn-primary">
              <ShoppingBag size={14} aria-hidden="true" /> Iniciar atendimento
            </button>
          )}
        </div>

        {isThisCustomerActive && sessionItems.length > 0 && (
          <ul role="list" className="divide-y divide-coral-200/60 mb-4">
            {sessionItems.map((item) => (
              <li
                key={item.product.id}
                className="py-3 flex items-center gap-3 flex-wrap"
              >
                <div className="w-14 h-14 bg-white border border-coral-200 flex-shrink-0 overflow-hidden">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.imageAlt || item.product.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <div className="text-[10px] uppercase tracking-label font-bold text-coral-500">
                    {item.product.collection || item.product.brand.toUpperCase()}
                  </div>
                  <div className="text-sm font-medium text-ink-7 leading-snug">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-ink-5 font-mono mt-0.5">
                    {item.product.sku} · {item.product.metal}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-9 h-9 border border-coral-300 hover:bg-white flex items-center justify-center transition"
                    aria-label={`Diminuir quantidade de ${item.product.name}`}
                  >
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <span
                    className="w-8 text-center font-bold tabular-nums"
                    aria-label={`Quantidade ${item.quantity}`}
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-9 h-9 border border-coral-300 hover:bg-white flex items-center justify-center transition"
                    aria-label={`Aumentar quantidade de ${item.product.name}`}
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>
                <div className="text-right min-w-[88px]">
                  <div className="font-bold text-ink-7 tabular-nums">
                    {formatBRL(item.product.price * item.quantity)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="mt-0.5 text-[11px] uppercase tracking-cta font-bold text-ink-5 hover:text-danger inline-flex items-center gap-1"
                    aria-label={`Remover ${item.product.name} da sacola`}
                  >
                    <Trash2 size={11} aria-hidden="true" /> Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {isThisCustomerActive && sessionItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center pt-3 border-t border-coral-200">
            <div>
              <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
                Total da sacola
              </div>
              <div className="font-serif text-2xl md:text-3xl font-semibold text-coral-500 tabular-nums">
                {formatBRL(sessionTotal)}
              </div>
            </div>
            <button onClick={handleGoToBag} className="btn-secondary btn-lg">
              <ShoppingBag size={14} aria-hidden="true" /> Ver sacola completa
            </button>
            <button onClick={handleGoToPayment} className="btn-primary btn-lg">
              <CreditCard size={14} aria-hidden="true" /> Ir ao pagamento
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        {isThisCustomerActive && sessionItems.length === 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate(tp('/catalogo'))} className="btn-primary">
              Ir ao catálogo
            </button>
            <button onClick={() => navigate(tp('/catalogo-estendido'))} className="btn-secondary">
              <Globe size={14} aria-hidden="true" /> Endless Aisle
            </button>
          </div>
        )}
      </section>

      {/* EP-03-F2 · Identidades cross-channel · CTA de mesclagem */}
      <section className="card p-4 md:p-5 flex items-center gap-4 flex-wrap bg-coral-50/40 border-coral-200">
        <div
          aria-hidden="true"
          className="w-12 h-12 bg-coral-500 text-white flex items-center justify-center flex-shrink-0"
        >
          <Link2 size={20} />
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-1 inline-flex items-center gap-1.5">
            <Sparkles size={11} aria-hidden="true" />
            Agente IA · Cross-Channel Unifier
          </div>
          <h3 className="font-serif text-lg md:text-xl text-ink-7">
            3 identidades pendentes de mesclagem
          </h3>
          <p className="text-[12px] text-ink-5 mt-1">
            Detectamos atividade no e-commerce, app e WhatsApp · o Agente IA já correlacionou os
            pontos de contato e propõe a fusão · você só precisa revisar e confirmar.
          </p>
        </div>
        <button type="button" onClick={() => setMergeOpen(true)} className="btn-primary">
          Revisar e mesclar
        </button>
      </section>

      {/* EP-03-F1 · Timeline cross-channel */}
      {interactions.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h2 className="heading-serif text-fluid-h3 flex items-center gap-2">
                <Activity size={18} className="text-coral-500" aria-hidden="true" />
                Timeline · cross-channel
              </h2>
              <span className="text-[10px] uppercase tracking-cta font-bold text-ink-5 inline-flex items-center gap-1.5 mt-1">
                <Sparkles size={10} className="text-coral-500" aria-hidden="true" />
                Identidade unificada pelo Agente IA · {interactions.length} pontos de contato
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-cta font-bold text-ink-5">
              {interactions.length} interações
            </span>
          </div>
          <ol role="list" className="relative pl-6 space-y-3">
            <span
              aria-hidden="true"
              className="absolute left-[11px] top-1 bottom-1 w-px bg-border"
            />
            {interactions.map((interaction) => {
              const Icon = CHANNEL_ICON[interaction.channel];
              return (
                <li key={interaction.id} className="relative">
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'absolute -left-6 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white',
                      CHANNEL_COLOR[interaction.channel],
                    )}
                  >
                    <Icon size={11} />
                  </span>
                  <div className="card p-3.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <strong className="text-sm text-ink-7">{interaction.title}</strong>
                      <span className="text-[10px] uppercase tracking-cta font-bold text-ink-5">
                        · {interaction.channel}
                      </span>
                      <span className="text-[11px] text-ink-5 ml-auto">
                        {formatRelativeDate(interaction.at)}
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-6 mt-1.5 leading-relaxed">
                      {interaction.description}
                    </p>
                    {interaction.amount && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-coral-500">
                        <Package size={11} aria-hidden="true" /> {formatBRL(interaction.amount)}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* LI insights · LI-05 Antecipatório */}
      <section className="bg-ink-7 text-white p-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-label text-coral-200 font-bold mb-3">
          <Sparkles size={12} />
          Living Intelligence · LI-05 Clienteling Antecipatório
        </div>
        <h2 className="heading-serif text-3xl text-white mb-3">
          {dToBirthday !== null && dToBirthday >= 0 && dToBirthday <= 14
            ? <>Janela de propensão alta detectada · <em className="text-coral-200">aniversário</em></>
            : <>Cliente em ciclo de recompra estimado em <em className="text-coral-200">28 dias</em></>}
        </h2>
        <p className="text-white/70 text-sm leading-relaxed mb-4">
          Modelo LSTM treinado com dados Vivara dos últimos 24 meses. Ação sugerida: enviar mensagem 1:1 personalizada
          via WhatsApp Business com peça da wishlist e oferta exclusiva (margem otimizada).
        </p>
        <div className="flex gap-3">
          <button className="btn-primary">Disparar ação Agente IA</button>
          <button className="btn-secondary border-white text-white hover:bg-white hover:text-ink-7">Ver razão do modelo</button>
        </div>
      </section>

      {/* Preferências e Wishlist */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-1">
          <h2 className="heading-serif text-fluid-h3 mb-3 flex items-center gap-2">
            <Heart size={18} className="text-coral-500" aria-hidden="true" />
            Preferências
          </h2>
          <div className="space-y-2">
            {customer.preferences.map(pref => (
              <div key={pref} className="card p-3 text-sm text-ink-6">{pref}</div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h2 className="heading-serif text-fluid-h3">Wishlist</h2>
            {wishlistProducts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (!isThisCustomerActive) selectCustomer(customer);
                  let added = 0;
                  wishlistProducts.forEach((p) => {
                    if (p) {
                      addToCart(p);
                      added += 1;
                    }
                  });
                  if (added > 0) {
                    toast.success(`${added} peças da wishlist na sacola`, {
                      description: 'Cliente vinculado · revise antes de pagar.',
                    });
                  }
                }}
                className="btn-tertiary p-0 text-[11px] inline-flex items-center gap-1"
                aria-label="Adicionar todas as peças da wishlist à sacola"
              >
                <ShoppingBag size={12} aria-hidden="true" /> Adicionar todas
              </button>
            )}
          </div>
          {wishlistProducts.length === 0 ? (
            <div className="card p-6 text-center text-ink-5">Sem peças na wishlist.</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {wishlistProducts.map(p => p && <ProductCard key={p.id} product={p} />)}
              </div>
              <ul role="list" className="card divide-y divide-border-light">
                {wishlistProducts.map((p) =>
                  p ? (
                    <li
                      key={`wlrow-${p.id}`}
                      className="p-3 flex items-center gap-3 flex-wrap"
                    >
                      <div className="w-12 h-12 bg-ink-1 flex-shrink-0 overflow-hidden">
                        <img
                          src={p.imageUrl}
                          alt={p.imageAlt || p.name}
                          loading="lazy"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <div className="text-sm font-medium text-ink-7 leading-snug truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-ink-5 font-mono">
                          {p.sku} · {formatBRL(p.price)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddWishlistItem(p.id)}
                        className="btn-primary btn-sm"
                        aria-label={`Adicionar ${p.name} à sacola da venda`}
                      >
                        <ShoppingBag size={12} aria-hidden="true" /> Sacola
                      </button>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Histórico */}
      <section>
        <h2 className="heading-serif text-fluid-h3 mb-3">Histórico de pedidos</h2>
        {customerOrders.length === 0 ? (
          <div className="card p-6 text-center text-ink-5">Sem pedidos registrados ainda.</div>
        ) : (
          <div className="relative">
            <div
              className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white pointer-events-none lg:hidden"
              aria-hidden="true"
            />
            <div className="overflow-x-auto card">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-ink-1">
                  <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Pedido</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Data</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Itens</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Pagamento</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Total</th>
                </tr>
              </thead>
              <tbody>
                {customerOrders.map(o => (
                  <tr key={o.id} className="border-b border-border-light hover:bg-coral-50">
                    <td className="p-3 font-mono text-[12px]">{o.id}</td>
                    <td className="p-3 text-ink-6">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 text-ink-6">{o.items.map(i => i.product.name.split(' ').slice(0,3).join(' ')).join(' · ')}</td>
                    <td className="p-3 text-ink-6 capitalize">{o.paymentMethod}{o.installments ? ` ${o.installments}x` : ''}</td>
                    <td className="p-3 text-right font-bold">{formatBRL(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </section>

      {/* Outros clientes */}
      {otherCustomers.length > 0 && (
        <section>
          <h2 className="heading-serif text-fluid-h3 mb-3">Outros clientes Diamond</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherCustomers.map(c => <CustomerCard key={c.id} customer={c} compact />)}
          </div>
        </section>
      )}

      <IdentityMergeDialog
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        customer={customer}
      />
    </div>
  );
}
