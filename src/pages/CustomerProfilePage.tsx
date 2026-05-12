import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
} from 'lucide-react';
import { customers, getCustomerById, getProductById, orders } from '@/data/mocks';
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
  const { selectCustomer } = usePosStore();
  const customer = getCustomerById(id);
  const [loading, setLoading] = useState(true);

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
  const [mergeOpen, setMergeOpen] = useState(false);

  const handleStartAttendance = () => {
    selectCustomer(customer);
    navigate(tp('/catalogo'));
  };

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

      {/* EP-03-F2 · Identidades cross-channel · CTA de mesclagem */}
      <section className="card p-4 md:p-5 flex items-center gap-4 flex-wrap bg-coral-50/40 border-coral-200">
        <div
          aria-hidden="true"
          className="w-12 h-12 bg-coral-500 text-white flex items-center justify-center flex-shrink-0"
        >
          <Link2 size={20} />
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-1">
            CDP · Cross-channel
          </div>
          <h3 className="font-serif text-lg md:text-xl text-ink-7">
            3 identidades pendentes de mesclagem
          </h3>
          <p className="text-[12px] text-ink-5 mt-1">
            Detectamos atividade no e-commerce, app e WhatsApp · revise os matches antes de unificar.
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
            <h2 className="heading-serif text-fluid-h3 flex items-center gap-2">
              <Activity size={18} className="text-coral-500" aria-hidden="true" />
              Timeline · cross-channel
            </h2>
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
          <button className="btn-primary">Disparar ação Copilot</button>
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
          <h2 className="heading-serif text-fluid-h3 mb-3">Wishlist</h2>
          {wishlistProducts.length === 0 ? (
            <div className="card p-6 text-center text-ink-5">Sem peças na wishlist.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {wishlistProducts.map(p => p && <ProductCard key={p.id} product={p} />)}
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
