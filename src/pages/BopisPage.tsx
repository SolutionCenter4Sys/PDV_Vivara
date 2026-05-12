import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  PackageCheck,
  AlertTriangle,
  IdCard,
  ShoppingBag,
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
} from '@/data/omnichannelMocks';
import { formatBRL, maskCpf } from '@/utils/format';

/**
 * EP-02-F2 · BOPIS / Click & Collect.
 *
 * Lista pedidos prontos para retirada na loja ativa, valida CPF do cliente
 * via modal e marca o pedido como "delivered".
 */

const cpfSchema = z.object({
  cpf: z
    .string()
    .min(11, 'Informe os 11 dígitos do CPF')
    .max(14, 'CPF inválido')
    .regex(/^[\d.\-\s]+$/, 'CPF deve conter apenas números'),
});
type CpfForm = z.infer<typeof cpfSchema>;

const PICKUP_STATUSES: OmsOrder['status'][] = [
  'allocated',
  'picking',
  'packed',
  'ready_for_pickup',
];

export function BopisPage() {
  const tenant = useAppSelector((s) => s.tenant.active);
  const [search, setSearch] = useState('');
  const [activeOrder, setActiveOrder] = useState<OmsOrder | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const orders = useMemo(() => {
    return omsOrders.filter(
      (o) =>
        o.fulfillmentMode === 'bopis' &&
        o.storeSlug === (tenant?.slug ?? 'morumbi') &&
        PICKUP_STATUSES.includes(o.status) &&
        !completedIds.includes(o.id),
    );
  }, [tenant, completedIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.pickupCode?.includes(q) ||
        o.customerCpf.replace(/\D/g, '').includes(q.replace(/\D/g, '')),
    );
  }, [orders, search]);

  const ready = filtered.filter((o) => o.status === 'ready_for_pickup');
  const pending = filtered.filter((o) => o.status !== 'ready_for_pickup');

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Atendimento', to: '/' }, { label: 'Retirada (BOPIS)' }]} />

      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
          EP-02-F2 · Click &amp; Collect
        </p>
        <h1 className="heading-serif text-fluid-h1">Retirada na loja</h1>
        <p className="text-ink-5 mt-1 text-[14px]">
          {orders.length} pedido{orders.length !== 1 ? 's' : ''} para a {tenant?.name ?? 'loja ativa'}.
          Confirme com CPF do cliente para liberar.
        </p>
      </header>

      <div className="mb-5 max-w-md">
        <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
          Buscar pedido / cliente / código
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
            placeholder="OMS-2026-... ou nome ou código de retirada"
            className="input pl-9"
            aria-label="Buscar pedido, cliente ou código de retirada"
          />
        </div>
      </div>

      <section className="mb-8" aria-labelledby="ready-h">
        <h2
          id="ready-h"
          className="text-[11px] uppercase tracking-cta font-bold text-success mb-3 inline-flex items-center gap-2"
        >
          <CheckCircle2 size={14} aria-hidden="true" />
          Prontos para retirada · {ready.length}
        </h2>
        {ready.length === 0 ? (
          <p className="text-[12px] text-ink-5 italic">Nenhum pedido pronto no momento.</p>
        ) : (
          <ul role="list" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {ready.map((o) => (
              <BopisCard key={o.id} order={o} onPickup={() => setActiveOrder(o)} />
            ))}
          </ul>
        )}
      </section>

      {pending.length > 0 && (
        <section aria-labelledby="pending-h">
          <h2
            id="pending-h"
            className="text-[11px] uppercase tracking-cta font-bold text-warning mb-3 inline-flex items-center gap-2"
          >
            <Clock size={14} aria-hidden="true" />
            Em separação · {pending.length}
          </h2>
          <ul role="list" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pending.map((o) => (
              <BopisCard key={o.id} order={o} disabled onPickup={() => {}} />
            ))}
          </ul>
        </section>
      )}

      <ConfirmCpfDialog
        order={activeOrder}
        onClose={() => setActiveOrder(null)}
        onConfirmed={(o) => {
          setCompletedIds((ids) => [...ids, o.id]);
          setActiveOrder(null);
          toast.success('Retirada concluída', {
            description: `${o.customerName} · ${o.id} marcado como entregue.`,
          });
        }}
      />
    </div>
  );
}

function BopisCard({
  order,
  disabled = false,
  onPickup,
}: {
  order: OmsOrder;
  disabled?: boolean;
  onPickup: () => void;
}) {
  const tone = STATUS_TONE[order.status];
  const elapsedH = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60 / 60);
  return (
    <li
      className={clsx(
        'card p-4 border-l-4',
        tone === 'success' && 'border-success bg-success/5',
        tone === 'warning' && 'border-warning bg-warning-light',
        tone === 'info' && 'border-coral-500 bg-coral-50',
        tone === 'danger' && 'border-danger bg-danger/5',
      )}
    >
      <header className="flex items-start gap-3 mb-3">
        <div
          className={clsx(
            'w-10 h-10 flex items-center justify-center flex-shrink-0',
            order.status === 'ready_for_pickup' ? 'bg-success text-white' : 'bg-warning text-white',
          )}
        >
          {order.status === 'ready_for_pickup' ? (
            <PackageCheck size={20} aria-hidden="true" />
          ) : (
            <Package size={20} aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] uppercase tracking-cta font-bold text-ink-7">
              {order.id}
            </span>
            <span className="tag bg-ink-2 text-ink-7">{CHANNEL_LABEL[order.channel]}</span>
            <span className="tag bg-ink-7 text-white font-mono">#{order.pickupCode}</span>
          </div>
          <div className="font-serif text-lg font-semibold text-ink-7 mt-1">{order.customerName}</div>
          <div className="text-[11px] text-ink-5 flex items-center gap-2">
            <IdCard size={11} aria-hidden="true" />
            CPF {maskCpf(order.customerCpf)}
            <span aria-hidden="true">·</span>
            {elapsedH < 1 ? 'há menos de 1h' : `há ${elapsedH}h`}
          </div>
        </div>
        <span
          className={clsx(
            'px-2 py-1 text-[10px] uppercase tracking-cta font-bold whitespace-nowrap',
            order.status === 'ready_for_pickup'
              ? 'bg-success text-white'
              : 'bg-warning text-white',
          )}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </header>

      <ul className="space-y-1 mb-3" role="list">
        {order.items.map((it) => (
          <li
            key={it.sku}
            className="flex items-center justify-between text-[12px] border-b border-border-light pb-1 last:border-0"
          >
            <span className="flex items-center gap-2 min-w-0">
              <ShoppingBag size={11} aria-hidden="true" className="text-ink-4 flex-shrink-0" />
              <span className="truncate">
                {it.quantity}× {it.productName}
              </span>
            </span>
            <span className="font-mono tabular-nums text-ink-7 ml-2">{formatBRL(it.unitPrice * it.quantity)}</span>
          </li>
        ))}
      </ul>

      <footer className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-serif text-lg font-semibold text-coral-500">
          {formatBRL(order.totalAmount)}
        </span>
        <button
          type="button"
          onClick={onPickup}
          disabled={disabled}
          className={clsx(
            'inline-flex items-center gap-2 min-h-[44px] px-4',
            disabled ? 'btn-tertiary' : 'btn-primary',
          )}
          aria-label={`Confirmar retirada do pedido ${order.id}`}
        >
          {disabled ? (
            <>
              <Clock size={14} aria-hidden="true" />
              Aguardando estoque
            </>
          ) : (
            <>
              <CheckCircle2 size={14} aria-hidden="true" />
              Confirmar retirada
            </>
          )}
        </button>
      </footer>

      {order.notes && (
        <div className="mt-3 text-[11px] bg-coral-50 border border-coral-200 px-3 py-2 flex items-start gap-2">
          <AlertTriangle size={11} aria-hidden="true" className="text-coral-500 mt-0.5 flex-shrink-0" />
          <span>{order.notes}</span>
        </div>
      )}
    </li>
  );
}

function ConfirmCpfDialog({
  order,
  onClose,
  onConfirmed,
}: {
  order: OmsOrder | null;
  onClose: () => void;
  onConfirmed: (o: OmsOrder) => void;
}) {
  const open = order !== null;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CpfForm>({
    resolver: zodResolver(cpfSchema),
    defaultValues: { cpf: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!order) return;
    const expected = order.customerCpf.replace(/\D/g, '');
    const got = data.cpf.replace(/\D/g, '');
    await new Promise((r) => setTimeout(r, 600));
    if (expected !== got) {
      setError('cpf', { message: 'CPF não confere com o cadastro do pedido' });
      toast.error('CPF inválido', {
        description: 'Solicite documento e verifique. Após 3 tentativas, escalar gerente.',
      });
      return;
    }
    onConfirmed(order);
    reset();
  });

  if (!order) return null;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      size="sm"
      title="Validar identidade do cliente"
      description={`Pedido ${order.id} · ${order.customerName}`}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-ink-1 border border-border p-3 text-[12px] flex items-start gap-2">
          <IdCard size={14} aria-hidden="true" className="text-ink-5 mt-0.5" />
          <div>
            Confirme com o documento físico do cliente. Este passo é obrigatório por
            <strong> LGPD/CDC</strong> antes de liberar a peça.
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
            CPF do cliente
          </label>
          <input
            {...register('cpf')}
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            autoFocus
            aria-invalid={errors.cpf ? 'true' : 'false'}
            className={clsx('input font-mono', errors.cpf && 'border-danger')}
          />
          {errors.cpf && (
            <p className="text-[11px] text-danger mt-1" role="alert">
              {errors.cpf.message}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border-light pt-3">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="btn-tertiary inline-flex items-center gap-2"
          >
            <X size={14} aria-hidden="true" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary inline-flex items-center gap-2"
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            {isSubmitting ? 'Validando...' : 'Liberar peça'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
