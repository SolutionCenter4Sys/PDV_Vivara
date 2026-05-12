import { useState } from 'react';
import {
  Camera,
  Sparkles,
  Wrench,
  ChevronRight,
  Calendar,
  PenLine,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { serviceOrders } from '@/data/mocks';
import { formatBRL, formatRelativeDate } from '@/utils/format';
import clsx from 'clsx';
import type { ServiceOrder } from '@/types';
import { Breadcrumb } from '@/components/Breadcrumb';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { SignaturePad } from '@/components/SignaturePad';

const STATUS_COLORS: Record<ServiceOrder['status'], string> = {
  recebido: 'bg-ink-2 text-ink-7',
  cotacao: 'bg-warning/15 text-warning',
  em_servico: 'bg-coral-200 text-ink-7',
  pronto: 'bg-success/15 text-success',
  entregue: 'bg-ink-7 text-white',
};

const STATUS_LABELS: Record<ServiceOrder['status'], string> = {
  recebido: 'Recebida',
  cotacao: 'Em cotação',
  em_servico: 'Em serviço',
  pronto: 'Pronto',
  entregue: 'Entregue',
};

export function ServiceOrderPage() {
  const [filter, setFilter] = useState<ServiceOrder['status'] | 'all'>('all');
  const [showNew, setShowNew] = useState(false);
  const [delivering, setDelivering] = useState<ServiceOrder | null>(null);
  const [signature, setSignature] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [delivered, setDelivered] = useState<Set<string>>(new Set());

  const filtered = filter === 'all' ? serviceOrders : serviceOrders.filter(o => o.status === filter);

  const handleDeliver = async () => {
    if (!delivering || !signature) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setDelivered((prev) => new Set(prev).add(delivering.id));
    toast.success(`OS ${delivering.id} entregue · recibo assinado`, {
      description: `${delivering.customer.name} · audit trail SAP GRC · cliente recebeu PDF por e-mail.`,
    });
    setDelivering(null);
    setSignature('');
  };

  return (
    <div className="space-y-8 reveal">
      <Breadcrumb items={[{ label: 'Ordem de Serviço' }]} />
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2 flex items-center gap-2">
            <Wrench size={14} aria-hidden="true" /> Vertical de joalheria · EP-04-F1
          </div>
          <h1 className="heading-serif text-fluid-h1">
            Ordens de <em className="text-coral-500">serviço</em>
          </h1>
          <p className="text-ink-5 text-base mt-2 max-w-2xl">
            Recepção · cotação · reparo · entrega. Cotação imediata via LI-07 (Reparo Inteligente · CV+LiDAR).
          </p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary">
          {showNew ? 'Fechar formulário' : 'Abrir nova OS'}
        </button>
      </header>

      {/* Nova OS · em mobile/tablet portrait câmera vira banner horizontal acima do form;
           em tablet landscape e desktop usa 1/3 + 2/3 lado a lado */}
      {showNew && (
        <section className="card p-4 md:p-5 lg:p-6 reveal">
          <h2 className="heading-serif text-fluid-h3 mb-4">Nova ordem de serviço</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-1">
              <button
                type="button"
                className="w-full lg:aspect-square min-h-[120px] lg:min-h-0 bg-coral-50 border border-dashed border-coral-200 flex flex-col md:flex-row lg:flex-col items-center justify-center gap-2 md:gap-4 lg:gap-2 p-4 cursor-pointer hover:bg-coral-100 transition"
                aria-label="Capturar peça via câmera com CV + LiDAR"
              >
                <Camera size={36} className="text-coral-500 md:size-12 lg:size-12" aria-hidden="true" />
                <div className="flex flex-col items-center md:items-start lg:items-center gap-1">
                  <span className="text-[11px] uppercase tracking-cta font-bold text-ink-7">Capturar peça</span>
                  <span className="text-[10px] text-ink-5">CV + LiDAR · LI-07</span>
                </div>
              </button>
            </div>
            <div className="lg:col-span-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="field">
                  <label>Cliente</label>
                  <input className="input" placeholder="CPF · email · telefone..." />
                </div>
                <div className="field">
                  <label>SKU da peça</label>
                  <input className="input" placeholder="BR00047389" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <label>Tipo de serviço</label>
                  <select className="input">
                    <option>Redimensionamento</option>
                    <option>Gravação</option>
                    <option>Polimento</option>
                    <option>Reparo</option>
                  </select>
                </div>
                <div className="field">
                  <label>Prazo estimado</label>
                  <input className="input" placeholder="7 dias" defaultValue="7" />
                </div>
              </div>

              <div className="bg-coral-50 border border-coral-200 p-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-label text-coral-500 font-bold">
                  <Sparkles size={12} aria-hidden="true" /> Cotação LI-07 · em tempo real
                </div>
                <div className="font-serif text-2xl md:text-3xl font-semibold text-ink-7">R$ 290,00</div>
                <div className="text-[12px] text-ink-6">
                  Defeito classificado · Aro pequeno · expansão de 1 número.<br />
                  Upsell sugerido: Limpeza profissional com banho de ródio +R$ 90.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="btn-primary w-full"
              >
                Confirmar OS
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Filtros */}
      <section
        role="tablist"
        aria-label="Filtrar ordens de serviço por status"
        className="flex items-center gap-2 flex-wrap"
      >
        <span className="text-[10px] uppercase tracking-label font-bold text-ink-5 mr-2">Filtrar:</span>
        {(['all', 'recebido', 'cotacao', 'em_servico', 'pronto', 'entregue'] as const).map(s => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={filter === s}
            onClick={() => setFilter(s)}
            className={clsx(
              'tag transition min-h-[36px] px-3',
              filter === s ? 'bg-ink-7 text-white' : 'tag-outline hover:bg-coral-50',
            )}
          >
            {s === 'all' ? 'Todas' : STATUS_LABELS[s as ServiceOrder['status']]}
          </button>
        ))}
      </section>

      {/* Lista */}
      <section className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            illustration="service"
            title="Nenhuma OS neste status"
            description="Troque o filtro acima ou abra uma nova ordem de serviço para reparo, gravação, redimensionamento ou polimento."
            primaryAction={
              <button onClick={() => setShowNew(true)} className="btn-primary">
                <Wrench size={14} aria-hidden="true" /> Abrir nova OS
              </button>
            }
            secondaryAction={
              <button onClick={() => setFilter('all')} className="btn-secondary">
                Ver todas
              </button>
            }
          />
        ) : (
          filtered.map(os => {
            const isDelivered = delivered.has(os.id) || os.status === 'entregue';
            const canDeliver = !isDelivered && os.status === 'pronto';
            const effectiveStatus: ServiceOrder['status'] = isDelivered ? 'entregue' : os.status;
            return (
              <article key={os.id} className="card p-4 md:p-5">
                <div className="grid grid-cols-2 md:grid-cols-[auto_1fr_auto_auto_auto] gap-3 md:gap-4 items-center">
                  <div className="md:col-span-1">
                    <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">OS</div>
                    <div className="font-mono text-[12px] font-bold">{os.id}</div>
                  </div>
                  <div className="text-right md:hidden">
                    <span className={clsx('tag', STATUS_COLORS[effectiveStatus])}>
                      {STATUS_LABELS[effectiveStatus]}
                    </span>
                  </div>
                  <div className="min-w-0 col-span-2 md:col-span-1">
                    <div className="font-semibold truncate">{os.productName}</div>
                    <div className="text-[12px] text-ink-5 capitalize">{os.type} · {os.customer.name}</div>
                    {os.defectClassification && (
                      <div className="text-[11px] text-coral-500 mt-1 flex items-center gap-1">
                        <Sparkles size={10} aria-hidden="true" /> LI-07 · {os.defectClassification}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Cotação</div>
                    <div className="font-bold">{os.estimatedPrice ? formatBRL(os.estimatedPrice) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 flex items-center gap-1">
                      <Calendar size={10} aria-hidden="true" /> Recebida
                    </div>
                    <div className="text-[12px] text-ink-6">{formatRelativeDate(os.receivedAt)}</div>
                  </div>
                  <div className="hidden md:flex items-center gap-3">
                    <span className={clsx('tag', STATUS_COLORS[effectiveStatus])}>
                      {STATUS_LABELS[effectiveStatus]}
                    </span>
                    {canDeliver ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDelivering(os);
                          setSignature('');
                        }}
                        className="btn-primary btn-sm"
                      >
                        <PenLine size={12} aria-hidden="true" />
                        Entregar
                      </button>
                    ) : (
                      <ChevronRight size={16} className="text-ink-4" aria-hidden="true" />
                    )}
                  </div>
                </div>
                {canDeliver && (
                  <div className="md:hidden mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDelivering(os);
                        setSignature('');
                      }}
                      className="btn-primary btn-sm w-full"
                    >
                      <PenLine size={12} aria-hidden="true" />
                      Entregar com assinatura
                    </button>
                  </div>
                )}
                {os.upsellSuggestion && (
                  <div className="mt-3 pt-3 border-t border-border-light text-[12px] text-ink-6">
                    <span className="text-[10px] uppercase tracking-label font-bold text-coral-500 mr-2">Upsell LI-07:</span>
                    {os.upsellSuggestion}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      <Modal
        open={!!delivering}
        onClose={() => {
          if (submitting) return;
          setDelivering(null);
          setSignature('');
        }}
        title={delivering ? `Entrega · ${delivering.id}` : 'Entrega'}
        description={delivering ? `${delivering.productName} · ${delivering.customer.name}` : undefined}
        size="lg"
        hideClose={submitting}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setDelivering(null);
                setSignature('');
              }}
              disabled={submitting}
              className="btn-tertiary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeliver}
              disabled={submitting || !signature}
              aria-busy={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                  />
                  Registrando…
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} aria-hidden="true" />
                  Confirmar entrega
                </>
              )}
            </button>
          </>
        }
      >
        {delivering && (
          <div className="space-y-5">
            <div className="bg-ink-1 border border-border p-4 grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Tipo</div>
                <div className="capitalize font-medium">{delivering.type}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Cotação</div>
                <div className="font-medium">
                  {delivering.estimatedPrice ? formatBRL(delivering.estimatedPrice) : 'Sem custo'}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Cliente</div>
                <div className="font-medium">{delivering.customer.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">SKU</div>
                <div className="font-mono text-[12px]">{delivering.productSku}</div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-2">
                Assinatura digital do cliente
              </h3>
              <SignaturePad onChange={(dataUrl) => setSignature(dataUrl)} />
              <p className="text-[11px] text-ink-5 mt-2 leading-relaxed">
                Assinatura é criptografada e anexada ao recibo PDF · obrigatória por LGPD para
                comprovar entrega de bem do cliente.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
