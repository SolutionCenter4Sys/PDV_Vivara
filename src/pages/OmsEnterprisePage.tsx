import { useMemo, useState } from 'react';
import {
  ListOrdered,
  Search,
  Globe,
  Smartphone,
  MessageCircle,
  Store,
  Instagram,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  omsOrders,
  STATUS_LABEL,
  STATUS_TONE,
  CHANNEL_LABEL,
  FULFILLMENT_LABEL,
  type OmsOrder,
  type OrderChannel,
  type OmsStatus,
} from '@/data/omnichannelMocks';
import { formatBRL } from '@/utils/format';

const CHANNEL_ICON: Record<OrderChannel, typeof Globe> = {
  web: Globe,
  app: Smartphone,
  whatsapp: MessageCircle,
  pdv: Store,
  instagram: Instagram,
};

/**
 * EP-02-F6 · OMS Enterprise · painel global de pedidos.
 *
 * Visão tempo real de todos os pedidos cross-channel da rede com filtros
 * por canal, fulfillment e status. Permite drill-down em pedido individual.
 */
export function OmsEnterprisePage() {
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<OrderChannel | 'all'>('all');
  const [status, setStatus] = useState<OmsStatus | 'all'>('all');
  const [fulfillment, setFulfillment] = useState<'all' | 'bopis' | 'ship_from_store' | 'ship_from_dc' | 'pickup_curbside'>(
    'all',
  );
  const [selected, setSelected] = useState<OmsOrder | null>(null);

  const orders = useMemo(() => {
    let list = [...omsOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerCpf.includes(q) ||
          o.awbCode?.toLowerCase().includes(q) ||
          o.pickupCode?.includes(q),
      );
    }
    if (channel !== 'all') list = list.filter((o) => o.channel === channel);
    if (status !== 'all') list = list.filter((o) => o.status === status);
    if (fulfillment !== 'all') list = list.filter((o) => o.fulfillmentMode === fulfillment);
    return list;
  }, [search, channel, status, fulfillment]);

  const kpis = useMemo(() => {
    const total = omsOrders.length;
    const ready = omsOrders.filter((o) => o.status === 'ready_for_pickup').length;
    const inTransit = omsOrders.filter((o) => o.status === 'in_transit').length;
    const processing = omsOrders.filter((o) =>
      ['paid', 'allocated', 'picking', 'packed'].includes(o.status),
    ).length;
    const gmv = omsOrders.reduce((s, o) => s + o.totalAmount, 0);
    return { total, ready, inTransit, processing, gmv };
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Gerência', to: '/gerencia' }, { label: 'OMS Enterprise' }]} />

      <header className="mb-6 flex items-start gap-3">
        <div className="bg-ink-7 text-white w-12 h-12 flex items-center justify-center flex-shrink-0">
          <ListOrdered size={24} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
            EP-02-F6 · Manhattan Active OMS
          </p>
          <h1 className="heading-serif text-fluid-h1">OMS Enterprise</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            Visão tempo real cross-canal · web, app, WhatsApp, Instagram, PDV · todos os tipos de fulfillment.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5" aria-label="Indicadores OMS">
        <Kpi label="Pedidos hoje" value={String(kpis.total)} tone="info" />
        <Kpi label="Em processamento" value={String(kpis.processing)} tone="warning" />
        <Kpi label="Prontos retirada" value={String(kpis.ready)} tone="success" />
        <Kpi label="Em trânsito" value={String(kpis.inTransit)} tone="info" />
        <Kpi label="GMV hoje" value={formatBRL(kpis.gmv)} tone="success" />
      </section>

      <section className="card p-4 mb-4" aria-label="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search
                size={16}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="OMS-, AWB, CPF, nome..."
                className="input pl-9"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Canal
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as OrderChannel | 'all')}
              className="input"
            >
              <option value="all">Todos</option>
              {(Object.keys(CHANNEL_LABEL) as OrderChannel[]).map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Fulfillment
            </label>
            <select
              value={fulfillment}
              onChange={(e) => setFulfillment(e.target.value as typeof fulfillment)}
              className="input"
            >
              <option value="all">Todos</option>
              <option value="bopis">{FULFILLMENT_LABEL.bopis}</option>
              <option value="ship_from_store">{FULFILLMENT_LABEL.ship_from_store}</option>
              <option value="ship_from_dc">{FULFILLMENT_LABEL.ship_from_dc}</option>
              <option value="pickup_curbside">{FULFILLMENT_LABEL.pickup_curbside}</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OmsStatus | 'all')}
              className="input"
            >
              <option value="all">Todos</option>
              {(Object.keys(STATUS_LABEL) as OmsStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="card overflow-x-auto">
        <table className="w-full text-[12px]" role="table">
          <caption className="sr-only">Lista de pedidos do OMS</caption>
          <thead>
            <tr className="bg-ink-1 text-left">
              <th scope="col" className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5">
                Pedido
              </th>
              <th scope="col" className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5">
                Cliente
              </th>
              <th scope="col" className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5">
                Canal
              </th>
              <th scope="col" className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5">
                Fulfillment
              </th>
              <th scope="col" className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5">
                Status
              </th>
              <th scope="col" className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5 text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const Icon = CHANNEL_ICON[o.channel];
              const tone = STATUS_TONE[o.status];
              return (
                <tr
                  key={o.id}
                  className="border-t border-border-light hover:bg-coral-50 cursor-pointer transition"
                  onClick={() => setSelected(o)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(o);
                    }
                  }}
                  aria-label={`Abrir pedido ${o.id}`}
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-ink-7">{o.id}</td>
                  <td className="px-3 py-2">{o.customerName}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <Icon size={12} aria-hidden="true" />
                      {CHANNEL_LABEL[o.channel]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px]">{FULFILLMENT_LABEL[o.fulfillmentMode]}</td>
                  <td className="px-3 py-2">
                    <span
                      className={clsx(
                        'tag',
                        tone === 'success' && 'bg-success text-white',
                        tone === 'warning' && 'bg-warning text-white',
                        tone === 'info' && 'bg-coral-500 text-white',
                        tone === 'danger' && 'bg-danger text-white',
                      )}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {formatBRL(o.totalAmount)}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-ink-5 text-[13px]">
                  Nenhum pedido com os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'info' | 'warning' | 'success' | 'danger';
}) {
  return (
    <div
      className={clsx(
        'card p-3 border-l-4',
        tone === 'success' && 'border-success',
        tone === 'warning' && 'border-warning',
        tone === 'info' && 'border-coral-500',
        tone === 'danger' && 'border-danger',
      )}
    >
      <div className="text-[10px] uppercase tracking-cta font-bold text-ink-5">{label}</div>
      <div className="font-serif text-2xl font-semibold text-ink-7 tabular-nums">{value}</div>
    </div>
  );
}

function OrderDetailDialog({ order, onClose }: { order: OmsOrder | null; onClose: () => void }) {
  if (!order) return null;
  const Icon = CHANNEL_ICON[order.channel];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      className="fixed inset-0 z-50 bg-ink-7/40 flex items-end md:items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white border border-border w-full max-w-2xl shadow-modal max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between p-4 border-b border-border-light">
          <div>
            <p className="text-[10px] uppercase tracking-cta text-ink-5">{order.id}</p>
            <h2 id="order-detail-title" className="heading-serif text-fluid-h3 font-semibold">
              {order.customerName}
            </h2>
            <p className="text-[11px] text-ink-5 mt-1 inline-flex items-center gap-2">
              <Icon size={11} aria-hidden="true" />
              {CHANNEL_LABEL[order.channel]} · {FULFILLMENT_LABEL[order.fulfillmentMode]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-ink-5 hover:text-ink-7"
            aria-label="Fechar detalhes"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="p-4 space-y-4">
          {/* Stepper */}
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-cta text-ink-4 overflow-x-auto pb-1">
            {(['paid', 'allocated', 'picking', 'packed', order.fulfillmentMode === 'bopis' ? 'ready_for_pickup' : 'in_transit', 'delivered'] as OmsStatus[]).map(
              (st, idx, arr) => {
                const reached = arr.indexOf(order.status) >= idx;
                return (
                  <div key={st} className="flex items-center gap-1">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2 py-1 whitespace-nowrap',
                        reached ? 'bg-coral-500 text-white' : 'bg-ink-2 text-ink-5',
                      )}
                    >
                      {reached ? (
                        <CheckCircle2 size={10} aria-hidden="true" />
                      ) : (
                        <Clock size={10} aria-hidden="true" />
                      )}
                      {STATUS_LABEL[st]}
                    </span>
                    {idx < arr.length - 1 && <span className="text-ink-3">→</span>}
                  </div>
                );
              },
            )}
          </div>

          {/* Items */}
          <ul role="list" className="space-y-1.5">
            {order.items.map((it) => (
              <li
                key={it.sku}
                className="flex items-center justify-between border-b border-border-light pb-1.5"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Package size={12} aria-hidden="true" className="text-ink-4" />
                  <span className="font-mono text-[11px] text-ink-5">{it.sku}</span>
                  <span className="truncate">
                    · {it.quantity}× {it.productName}
                  </span>
                </span>
                <span className="font-mono tabular-nums">{formatBRL(it.unitPrice * it.quantity)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between font-bold text-coral-500 pt-2">
              <span>Total</span>
              <span className="font-mono tabular-nums">{formatBRL(order.totalAmount)}</span>
            </li>
          </ul>

          {/* Logistics */}
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div className="border border-border p-3">
              <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">CPF</div>
              <div className="font-mono">{order.customerCpf}</div>
            </div>
            <div className="border border-border p-3">
              <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">Telefone</div>
              <div className="font-mono">{order.customerPhone ?? '—'}</div>
            </div>
            {order.fulfillmentMode === 'bopis' && (
              <>
                <div className="border border-border p-3">
                  <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">Loja retirada</div>
                  <div className="uppercase">{order.storeSlug}</div>
                </div>
                <div className="border border-border p-3">
                  <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">Código</div>
                  <div className="font-mono font-bold text-coral-500 text-base">#{order.pickupCode}</div>
                </div>
              </>
            )}
            {order.fulfillmentMode === 'ship_from_store' && (
              <>
                <div className="border border-border p-3">
                  <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">Origem</div>
                  <div className="uppercase">{order.fromStoreSlug}</div>
                </div>
                <div className="border border-border p-3">
                  <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">Destino</div>
                  <div>
                    {order.destinationCity}/{order.destinationUf}
                  </div>
                </div>
                <div className="border border-border p-3">
                  <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1 inline-flex items-center gap-1">
                    <Truck size={10} aria-hidden="true" />
                    Transportadora
                  </div>
                  <div className="uppercase">{order.carrier?.replace('_', ' ') ?? '—'}</div>
                </div>
                <div className="border border-border p-3">
                  <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">AWB</div>
                  <div className="font-mono">{order.awbCode ?? 'pendente'}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
