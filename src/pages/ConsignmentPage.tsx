import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Undo2,
  ShoppingBag,
  Clock,
  AlertTriangle,
  X,
  ScanLine,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { customers, products as allProducts } from '@/data/mocks';
import { formatBRL, maskCpf } from '@/utils/format';

/**
 * EP-04-F3 · Gestão de Consignação.
 *
 * Cadastro de saída de peças para experimentação na casa do cliente
 * (típico em joalheria de alto ticket: noivos, presentes Diamond).
 *
 * Status: aberta → devolvida_total / devolvida_parcial+venda / vendida_total
 *
 * SLA legal CDC: 7 dias corridos · alertar quando &gt;= 5 dias.
 */

type ConsignmentStatus = 'open' | 'partial_returned_sale' | 'returned' | 'sold' | 'overdue';

interface ConsignmentItem {
  sku: string;
  productName: string;
  unitPrice: number;
  status: 'pending' | 'returned' | 'sold';
}

interface Consignment {
  id: string;
  customerId: string;
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  sellerName: string;
  storeSlug: string;
  openedAt: string;
  dueAt: string;
  items: ConsignmentItem[];
  status: ConsignmentStatus;
  notes?: string;
}

const initialConsignments: Consignment[] = [
  {
    id: 'CSG-2026-0089',
    customerId: 'CUST-001',
    customerName: 'Beatriz Almeida',
    customerCpf: '123.456.789-00',
    customerPhone: '+55 11 98765-4321',
    sellerName: 'Bia',
    storeSlug: 'morumbi',
    openedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    items: [
      { sku: 'AN-VVR-CRNL', productName: 'Anel Solitário 18k', unitPrice: 4299, status: 'pending' },
      { sku: 'BR-VVR-CRWD', productName: 'Brincos Crown Diamond', unitPrice: 1299, status: 'pending' },
    ],
    status: 'open',
    notes: 'Cliente Diamond · pretende decidir com noivo até quinta',
  },
  {
    id: 'CSG-2026-0091',
    customerId: 'CUST-002',
    customerName: 'Lucas Henrique Silva',
    customerCpf: '987.654.321-00',
    customerPhone: '+55 11 91234-5678',
    sellerName: 'Pedro',
    storeSlug: 'morumbi',
    openedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    items: [
      { sku: 'CL-LIFE-INFY', productName: 'Colar Infinity', unitPrice: 599, status: 'pending' },
    ],
    status: 'open',
  },
];

const STATUS_LABEL: Record<ConsignmentStatus, string> = {
  open: 'Aberta',
  partial_returned_sale: 'Parcial · venda confirmada',
  returned: 'Devolvida',
  sold: 'Vendida',
  overdue: 'Vencida',
};

const STATUS_TONE: Record<ConsignmentStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  open: 'info',
  partial_returned_sale: 'success',
  returned: 'success',
  sold: 'success',
  overdue: 'danger',
};

const consignmentSchema = z.object({
  customerId: z.string().min(1, 'Selecione cliente'),
  notes: z.string().optional(),
  itemSkus: z.array(z.string()).min(1, 'Selecione ao menos 1 peça'),
});
type ConsignmentForm = z.infer<typeof consignmentSchema>;

export function ConsignmentPage() {
  const [consignments, setConsignments] = useState<Consignment[]>(initialConsignments);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<Consignment | null>(null);
  const [confirmAllReturn, setConfirmAllReturn] = useState<Consignment | null>(null);

  const enriched = useMemo(
    () =>
      consignments.map((c) => {
        const daysLeft = Math.floor(
          (new Date(c.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        const isOverdue = c.status === 'open' && daysLeft < 0;
        return { ...c, daysLeft, status: isOverdue ? ('overdue' as const) : c.status };
      }),
    [consignments],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched;
    const q = search.toLowerCase();
    return enriched.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.items.some((it) => it.sku.toLowerCase().includes(q)),
    );
  }, [enriched, search]);

  const handleResolveItem = (
    consignmentId: string,
    sku: string,
    action: 'returned' | 'sold',
  ) => {
    setConsignments((prev) =>
      prev.map((c) => {
        if (c.id !== consignmentId) return c;
        const newItems = c.items.map((it) => (it.sku === sku ? { ...it, status: action } : it));
        const allDone = newItems.every((it) => it.status !== 'pending');
        let newStatus: ConsignmentStatus = c.status;
        if (allDone) {
          const hasSale = newItems.some((it) => it.status === 'sold');
          const hasReturn = newItems.some((it) => it.status === 'returned');
          newStatus = hasSale && hasReturn ? 'partial_returned_sale' : hasSale ? 'sold' : 'returned';
        }
        return { ...c, items: newItems, status: newStatus };
      }),
    );
    toast.success(
      action === 'sold' ? 'Peça marcada como vendida' : 'Peça devolvida ao estoque',
    );
  };

  const handleReturnAll = (c: Consignment) => {
    setConsignments((prev) =>
      prev.map((cs) => {
        if (cs.id !== c.id) return cs;
        return {
          ...cs,
          items: cs.items.map((it) => ({ ...it, status: 'returned' })),
          status: 'returned',
        };
      }),
    );
    toast.success(`Consignação ${c.id} encerrada · devolução total`);
    setConfirmAllReturn(null);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Atendimento', to: '/' }, { label: 'Consignação' }]} />

      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
            EP-04-F3 · Joalheria
          </p>
          <h1 className="heading-serif text-fluid-h1">Consignações</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            Saída de peças para experimentação · prazo legal CDC 7 dias.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={14} aria-hidden="true" />
          Nova consignação
        </button>
      </header>

      <div className="mb-4 max-w-md">
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
            placeholder="CSG-, cliente, SKU..."
            className="input pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="card p-10 text-center text-ink-5">Nenhuma consignação no filtro.</p>
      ) : (
        <ul role="list" className="space-y-3">
          {filtered.map((c) => {
            const tone = STATUS_TONE[c.status];
            const total = c.items.reduce((s, it) => s + it.unitPrice, 0);
            const sold = c.items.filter((it) => it.status === 'sold').reduce((s, it) => s + it.unitPrice, 0);
            return (
              <li
                key={c.id}
                className={clsx(
                  'card border-l-4 p-4',
                  tone === 'success' && 'border-success',
                  tone === 'warning' && 'border-warning',
                  tone === 'info' && 'border-coral-500',
                  tone === 'danger' && 'border-danger bg-danger/5',
                )}
              >
                <header className="flex items-start gap-3 mb-3 flex-wrap">
                  <div className="bg-ink-7 text-white w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <Package size={20} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] uppercase tracking-cta font-bold text-ink-7">
                        {c.id}
                      </span>
                      <span
                        className={clsx(
                          'tag',
                          tone === 'success' && 'bg-success text-white',
                          tone === 'warning' && 'bg-warning text-white',
                          tone === 'info' && 'bg-coral-500 text-white',
                          tone === 'danger' && 'bg-danger text-white',
                        )}
                      >
                        {STATUS_LABEL[c.status]}
                      </span>
                      <span
                        className={clsx(
                          'tag',
                          c.daysLeft < 0
                            ? 'bg-danger text-white'
                            : c.daysLeft <= 2
                              ? 'bg-warning text-white'
                              : 'bg-ink-2 text-ink-7',
                        )}
                      >
                        {c.daysLeft < 0
                          ? `${Math.abs(c.daysLeft)}d em atraso`
                          : c.daysLeft === 0
                            ? 'vence hoje'
                            : `${c.daysLeft}d restantes`}
                      </span>
                    </div>
                    <div className="font-serif text-lg font-semibold text-ink-7 mt-1">
                      {c.customerName}
                    </div>
                    <div className="text-[11px] text-ink-5 flex flex-wrap gap-2">
                      <span>CPF {maskCpf(c.customerCpf)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{c.customerPhone}</span>
                      <span aria-hidden="true">·</span>
                      <span>vendedor {c.sellerName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-cta font-bold text-ink-5">
                      Em risco
                    </div>
                    <div className="font-serif text-xl font-semibold text-coral-500">
                      {formatBRL(total)}
                    </div>
                    {sold > 0 && (
                      <div className="text-[11px] text-success font-bold">
                        Vendido {formatBRL(sold)}
                      </div>
                    )}
                  </div>
                </header>

                <ul role="list" className="space-y-1.5 mb-3">
                  {c.items.map((it) => (
                    <li
                      key={it.sku}
                      className="flex items-center justify-between gap-2 border-b border-border-light pb-1.5 last:border-0 flex-wrap"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ScanLine
                          size={11}
                          aria-hidden="true"
                          className="text-ink-4 flex-shrink-0"
                        />
                        <span className="font-mono text-[11px] text-ink-5">{it.sku}</span>
                        <span className="text-[12px] truncate">· {it.productName}</span>
                        <span className="font-mono text-[11px] tabular-nums text-coral-500 ml-auto">
                          {formatBRL(it.unitPrice)}
                        </span>
                      </div>
                      <div className="flex gap-1.5 ml-auto">
                        {it.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResolveItem(c.id, it.sku, 'returned')}
                              className="btn-tertiary p-0 text-[10px] inline-flex items-center gap-1"
                              aria-label={`Devolver ${it.productName}`}
                            >
                              <Undo2 size={11} aria-hidden="true" />
                              Devolver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveItem(c.id, it.sku, 'sold')}
                              className="btn-secondary btn-sm text-[10px] inline-flex items-center gap-1"
                              aria-label={`Marcar ${it.productName} como vendida`}
                            >
                              <ShoppingBag size={11} aria-hidden="true" />
                              Vender
                            </button>
                          </>
                        ) : (
                          <span
                            className={clsx(
                              'tag',
                              it.status === 'sold' ? 'bg-success text-white' : 'bg-ink-2 text-ink-7',
                            )}
                          >
                            {it.status === 'sold' ? 'vendida' : 'devolvida'}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {c.notes && (
                  <div className="text-[11px] bg-coral-50 border border-coral-200 px-3 py-2 mb-3 flex items-start gap-2">
                    <AlertTriangle
                      size={11}
                      aria-hidden="true"
                      className="text-coral-500 mt-0.5 flex-shrink-0"
                    />
                    <span>{c.notes}</span>
                  </div>
                )}

                {c.status === 'open' || c.status === 'overdue' ? (
                  <footer className="border-t border-border-light pt-3 flex justify-end gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setConfirmAllReturn(c)}
                      className="btn-tertiary inline-flex items-center gap-1 text-[11px]"
                    >
                      <Undo2 size={12} aria-hidden="true" />
                      Devolução total
                    </button>
                  </footer>
                ) : (
                  <footer className="border-t border-border-light pt-3 text-[11px] text-success inline-flex items-center gap-1">
                    <CheckCircle2 size={12} aria-hidden="true" />
                    Encerrada em {new Date().toLocaleDateString('pt-BR')}
                  </footer>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <CreateConsignmentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(c) => {
          setConsignments((prev) => [c, ...prev]);
          toast.success(`Consignação ${c.id} criada`, {
            description: 'Termo de responsabilidade enviado ao e-mail e WhatsApp do cliente.',
          });
          setCreateOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!confirmAllReturn}
        onClose={() => setConfirmAllReturn(null)}
        onConfirm={() => {
          if (confirmAllReturn) handleReturnAll(confirmAllReturn);
        }}
        tone="warning"
        title="Confirmar devolução total"
        description={`Todas as peças voltam ao estoque · ${confirmAllReturn?.id}`}
        body={
          confirmAllReturn ? (
            <ul className="text-[12px] text-ink-6 space-y-1 list-disc pl-4">
              {confirmAllReturn.items.map((it) => (
                <li key={it.sku}>
                  {it.sku} · {it.productName}
                </li>
              ))}
            </ul>
          ) : null
        }
        confirmLabel="Devolver tudo"
      />
    </div>
  );
}

function CreateConsignmentDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: Consignment) => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConsignmentForm>({
    resolver: zodResolver(consignmentSchema),
    defaultValues: { customerId: '', notes: '', itemSkus: [] },
  });

  const selectedSkus = watch('itemSkus') ?? [];
  const toggleSku = (sku: string) => {
    const next = selectedSkus.includes(sku)
      ? selectedSkus.filter((s) => s !== sku)
      : [...selectedSkus, sku];
    setValue('itemSkus', next, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (data) => {
    await new Promise((r) => setTimeout(r, 600));
    const c = customers.find((cu) => cu.id === data.customerId);
    if (!c) return;
    const items: ConsignmentItem[] = data.itemSkus
      .map((sku) => allProducts.find((p) => p.sku === sku))
      .filter(Boolean)
      .map((p) => ({
        sku: p!.sku,
        productName: p!.name,
        unitPrice: p!.price,
        status: 'pending' as const,
      }));
    onCreated({
      id: `CSG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      customerId: c.id,
      customerName: c.name,
      customerCpf: c.cpf,
      customerPhone: c.phone,
      sellerName: 'Você',
      storeSlug: 'morumbi',
      openedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      items,
      status: 'open',
      notes: data.notes || undefined,
    });
    reset();
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      size="md"
      title="Nova consignação"
      description="Termo CDC · prazo 7 dias corridos · cliente assina ao receber"
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
            Cliente
          </label>
          <select {...register('customerId')} className="input">
            <option value="">— Selecione —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.tier} · {maskCpf(c.cpf)}
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="text-[11px] text-danger mt-1">{errors.customerId.message}</p>
          )}
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
            Peças (selecione 1 ou mais)
          </label>
          <div className="border border-border max-h-56 overflow-y-auto divide-y divide-border-light">
            {allProducts.slice(0, 12).map((p) => {
              const selected = selectedSkus.includes(p.sku);
              return (
                <label
                  key={p.sku}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-coral-50 transition',
                    selected && 'bg-coral-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSku(p.sku)}
                    className="w-4 h-4 accent-coral-500"
                  />
                  <span className="font-mono text-[11px] text-ink-5">{p.sku}</span>
                  <span className="text-[12px] truncate flex-1">{p.name}</span>
                  <span className="font-mono text-[11px] text-coral-500 font-bold">
                    {formatBRL(p.price)}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.itemSkus && (
            <p className="text-[11px] text-danger mt-1">{errors.itemSkus.message}</p>
          )}
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
            Notas
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Ex: cliente Diamond · decisão até quinta..."
            className="input resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border-light pt-3">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="btn-tertiary inline-flex items-center gap-1"
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
            {isSubmitting ? 'Gerando termo...' : 'Confirmar e enviar termo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
