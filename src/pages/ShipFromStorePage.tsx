import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Truck,
  Package,
  Printer,
  CheckCircle2,
  ScanLine,
  MapPin,
  Clock,
  Search,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Modal } from '@/components/Modal';
import { useAppSelector } from '@app/store/hooks';
import {
  omsOrders,
  STATUS_LABEL,
  STATUS_TONE,
  CHANNEL_LABEL,
  type OmsOrder,
  type OmsStatus,
} from '@/data/omnichannelMocks';
import { formatBRL } from '@/utils/format';

/**
 * EP-02-F3 · Ship-from-Store · painel logístico de loja.
 *
 * Lista pedidos a serem separados/embalados/expedidos a partir da loja
 * ativa. Permite avançar status (allocated → picking → packed → in_transit)
 * e gerar/imprimir etiqueta com AWB.
 */

const STAGES: { id: OmsStatus; label: string; next: OmsStatus | null }[] = [
  { id: 'allocated', label: 'Alocado', next: 'picking' },
  { id: 'picking', label: 'Em separação', next: 'packed' },
  { id: 'packed', label: 'Embalado · gerar AWB', next: 'in_transit' },
  { id: 'in_transit', label: 'Em trânsito', next: null },
];

const SFS_STATUSES: OmsStatus[] = ['allocated', 'picking', 'packed', 'in_transit'];

type Override = Record<string, OmsStatus>;

export function ShipFromStorePage() {
  const tenant = useAppSelector((s) => s.tenant.active);
  const [overrides, setOverrides] = useState<Override>({});
  const [search, setSearch] = useState('');
  const [labelOrder, setLabelOrder] = useState<OmsOrder | null>(null);

  const orders = useMemo(() => {
    return omsOrders
      .filter((o) => o.fulfillmentMode === 'ship_from_store' && o.fromStoreSlug === (tenant?.slug ?? 'morumbi'))
      .map((o) => ({ ...o, status: overrides[o.id] ?? o.status }))
      .filter((o) => SFS_STATUSES.includes(o.status));
  }, [tenant, overrides]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.awbCode?.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const advance = (orderId: string, current: OmsStatus, next: OmsStatus | null) => {
    if (!next) return;
    setOverrides((prev) => ({ ...prev, [orderId]: next }));
    if (next === 'in_transit') {
      const order = orders.find((o) => o.id === orderId);
      if (order && !order.awbCode) {
        toast.success('AWB gerado', {
          description: 'Etiqueta pronta para impressão · transportadora notificada.',
        });
      }
    } else {
      toast.success(`Pedido ${orderId} → ${STATUS_LABEL[next]}`);
    }
  };

  const counts = useMemo(() => {
    const c: Record<OmsStatus, number> = {
      created: 0,
      paid: 0,
      allocated: 0,
      picking: 0,
      packed: 0,
      ready_for_pickup: 0,
      in_transit: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1));
    return c;
  }, [orders]);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Atendimento', to: '/' }, { label: 'Ship-from-Store' }]} />

      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
          EP-02-F3 · Logística de loja
        </p>
        <h1 className="heading-serif text-fluid-h1">Pedidos para expedição</h1>
        <p className="text-ink-5 mt-1 text-[14px]">
          {filtered.length} pedido{filtered.length !== 1 ? 's' : ''} para separar/embalar/enviar a partir da{' '}
          {tenant?.name ?? 'loja ativa'}.
        </p>
      </header>

      {/* KPIs por estágio */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {STAGES.map((stg) => (
          <div
            key={stg.id}
            className={clsx(
              'card p-3 text-center border-l-4',
              stg.id === 'allocated' && 'border-coral-500',
              stg.id === 'picking' && 'border-warning',
              stg.id === 'packed' && 'border-coral-300',
              stg.id === 'in_transit' && 'border-success',
            )}
          >
            <div className="text-[10px] uppercase tracking-cta font-bold text-ink-5">{stg.label}</div>
            <div className="font-serif text-3xl font-semibold text-ink-7 tabular-nums">
              {counts[stg.id]}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 max-w-md">
        <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
          Buscar pedido / cliente / AWB
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
            placeholder="OMS-... ou nome ou AWB"
            className="input pl-9"
            aria-label="Buscar pedido, cliente ou rastreio"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="card p-8 text-center text-ink-5 text-[13px]">
          Nenhum pedido para expedição neste momento.
        </p>
      ) : (
        <ul role="list" className="space-y-3">
          {filtered.map((o) => {
            const stage = STAGES.find((s) => s.id === o.status);
            const tone = STATUS_TONE[o.status];
            return (
              <li
                key={o.id}
                className={clsx(
                  'card border-l-4 p-4',
                  tone === 'success' && 'border-success',
                  tone === 'warning' && 'border-warning',
                  tone === 'info' && 'border-coral-500',
                )}
              >
                <header className="flex items-start gap-3 mb-3 flex-wrap">
                  <div className="bg-ink-7 text-white w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <Truck size={20} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] uppercase tracking-cta font-bold text-ink-7">
                        {o.id}
                      </span>
                      <span className="tag bg-ink-2 text-ink-7">{CHANNEL_LABEL[o.channel]}</span>
                      <span className="tag bg-coral-500 text-white">{STATUS_LABEL[o.status]}</span>
                    </div>
                    <div className="font-serif text-lg font-semibold text-ink-7 mt-1">
                      {o.customerName}
                    </div>
                    <div className="text-[11px] text-ink-5 flex items-center gap-2 flex-wrap">
                      <MapPin size={11} aria-hidden="true" />
                      {o.destinationCity}/{o.destinationUf}
                      <span aria-hidden="true">·</span>
                      <Clock size={11} aria-hidden="true" />
                      SLA {o.shippingSlaH}h
                      {o.carrier && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="uppercase">{o.carrier.replace('_', ' ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="font-serif text-xl font-semibold text-coral-500">
                    {formatBRL(o.totalAmount)}
                  </span>
                </header>

                <ul className="space-y-1 mb-3" role="list">
                  {o.items.map((it) => (
                    <li
                      key={it.sku}
                      className="flex items-center justify-between text-[12px] border-b border-border-light pb-1 last:border-0"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <ScanLine size={11} aria-hidden="true" className="text-ink-4 flex-shrink-0" />
                        <span className="font-mono text-[11px] text-ink-5">{it.sku}</span>
                        <span className="truncate">
                          · {it.quantity}× {it.productName}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <footer className="flex items-center gap-2 flex-wrap border-t border-border-light pt-3">
                  {o.awbCode && (
                    <span className="font-mono text-[11px] tabular-nums text-ink-5">
                      AWB <strong className="text-ink-7">{o.awbCode}</strong>
                    </span>
                  )}
                  <div className="ml-auto flex gap-2 flex-wrap">
                    {(o.status === 'packed' || o.status === 'in_transit') && (
                      <button
                        type="button"
                        onClick={() => setLabelOrder(o)}
                        className="btn-secondary btn-sm inline-flex items-center gap-2"
                        aria-label={`Imprimir etiqueta do pedido ${o.id}`}
                      >
                        <Printer size={14} aria-hidden="true" />
                        Etiqueta
                      </button>
                    )}
                    {stage?.next && (
                      <button
                        type="button"
                        onClick={() => advance(o.id, o.status, stage.next)}
                        className="btn-primary btn-sm inline-flex items-center gap-2"
                      >
                        <CheckCircle2 size={14} aria-hidden="true" />
                        Avançar para {STATUS_LABEL[stage.next]}
                      </button>
                    )}
                  </div>
                </footer>
              </li>
            );
          })}
        </ul>
      )}

      <ShipLabelDialog order={labelOrder} onClose={() => setLabelOrder(null)} />
    </div>
  );
}

function ShipLabelDialog({ order, onClose }: { order: OmsOrder | null; onClose: () => void }) {
  if (!order) return null;
  const awb = order.awbCode ?? `LGI-${Date.now().toString(36).toUpperCase()}`;

  return (
    <Modal open={!!order} onClose={onClose} size="md" title="Etiqueta de envio · AWB">
      <div className="border-2 border-ink-7 p-4 bg-white font-mono text-[12px] space-y-2">
        <header className="flex items-center justify-between border-b border-ink-7 pb-2">
          <div className="font-serif text-xl font-bold uppercase">VIVARA · {order.carrier?.toUpperCase().replace('_', ' ')}</div>
          <Package size={28} aria-hidden="true" />
        </header>

        <div>
          <div className="text-[9px] uppercase tracking-cta">Remetente</div>
          <div>VIVARA SA · {order.fromStoreSlug?.toUpperCase()} · CNPJ 23.572.560/0001-39</div>
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-cta">Destinatário</div>
          <div className="font-bold">{order.customerName}</div>
          <div>
            {order.destinationCity} / {order.destinationUf}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-b border-ink-7 py-2">
          <div>
            <div className="text-[9px] uppercase tracking-cta">Pedido</div>
            <div className="font-bold">{order.id}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-cta">SLA</div>
            <div className="font-bold">{order.shippingSlaH}h</div>
          </div>
        </div>

        <div className="text-center py-3">
          {/* Mock barcode */}
          <div className="flex items-end justify-center gap-px h-12 mb-2">
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                className="bg-ink-7"
                style={{ width: '2px', height: `${30 + ((i * 17) % 24)}px` }}
              />
            ))}
          </div>
          <div className="font-bold text-base">{awb}</div>
        </div>

        <div className="text-[9px] text-center uppercase tracking-cta border-t border-ink-7 pt-2">
          NF-e referenciada · {order.id} · Vivara Logística
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 border-t border-border-light pt-3">
        <button type="button" onClick={onClose} className="btn-tertiary inline-flex items-center gap-2">
          <X size={14} aria-hidden="true" />
          Fechar
        </button>
        <button
          type="button"
          onClick={() => {
            window.print();
            toast.success('Etiqueta enviada à impressora térmica');
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Printer size={14} aria-hidden="true" />
          Imprimir
        </button>
      </div>
    </Modal>
  );
}
