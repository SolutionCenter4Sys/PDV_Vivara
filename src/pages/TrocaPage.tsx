import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  ShoppingBag,
  Package,
  Globe,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { orders, products } from '@/data/mocks';
import { formatBRL, maskCpf } from '@/utils/format';
import type { Order, Product } from '@/types';
import { Breadcrumb } from '@/components/Breadcrumb';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { usePosStore } from '@/store/usePosStore';

/**
 * EP-02-F5 · Trocas/Devoluções Cross-channel
 *
 * F5-FE-01 Iniciar troca · busca pedido por CPF/NF
 * F5-FE-02 Resumo de troca · diferença a pagar/receber
 *
 * Mock: mesma identidade entre online (.com.br) e físico (loja).
 * Backend (Fase 2) cria NF de devolução + NF de saída via OMS.
 */

const lookupSchema = z.object({
  query: z.string().min(3, 'Digite ao menos 3 caracteres (CPF, NF ou e-mail)'),
});
type LookupValues = z.infer<typeof lookupSchema>;

type Step = 'lookup' | 'select' | 'replacement' | 'summary';

export function TrocaPage() {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const [step, setStep] = useState<Step>('lookup');
  const [foundOrders, setFoundOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnedItems, setReturnedItems] = useState<Set<string>>(new Set());
  const [replacement, setReplacement] = useState<Product | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);
  const { addToCart, applyDiscount, clearCart, selectCustomer } = usePosStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LookupValues>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { query: '' },
    mode: 'onBlur',
  });

  const onLookup = handleSubmit(async (values) => {
    await new Promise((r) => setTimeout(r, 380));
    const q = values.query.toLowerCase().replace(/\D/g, '');
    const free = values.query.toLowerCase();
    const matched = orders.filter(
      (o) =>
        (q && o.customer?.cpf.replace(/\D/g, '').includes(q)) ||
        o.id.toLowerCase().includes(free) ||
        o.customer?.email.toLowerCase().includes(free) ||
        o.customer?.name.toLowerCase().includes(free),
    );
    setFoundOrders(matched);
    if (matched.length === 0) {
      toast.error('Nenhum pedido encontrado', {
        description: 'Verifique CPF, número da NF ou e-mail · ou abra venda nova.',
      });
      return;
    }
    if (matched.length === 1) {
      setSelectedOrder(matched[0]);
      setStep('select');
    } else {
      setStep('select');
    }
  });

  const toggleItem = (sku: string) => {
    setReturnedItems((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const returnedTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    return selectedOrder.items
      .filter((i) => returnedItems.has(i.product.sku))
      .reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }, [selectedOrder, returnedItems]);

  const diff = (replacement?.price ?? 0) - returnedTotal;
  const diffLabel: 'pagar' | 'receber' | 'mesmo' =
    diff > 0 ? 'pagar' : diff < 0 ? 'receber' : 'mesmo';

  const recommendedReplacements = useMemo(() => {
    if (!selectedOrder) return [];
    const cats = new Set(
      selectedOrder.items
        .filter((i) => returnedItems.has(i.product.sku))
        .map((i) => i.product.category),
    );
    return products.filter((p) => cats.has(p.category)).slice(0, 6);
  }, [selectedOrder, returnedItems]);

  const handleConfirm = () => {
    setDone(true);
    setConfirmOpen(false);
    toast.success('Troca registrada · NF de devolução + NF de saída emitidas');
  };

  const handleChargeDifference = () => {
    if (!selectedOrder?.customer || !replacement || diff <= 0) {
      navigate(tp('/pagamento'));
      return;
    }

    clearCart();
    selectCustomer(selectedOrder.customer);
    addToCart(replacement);
    applyDiscount(
      replacement.id,
      Number(((returnedTotal / replacement.price) * 100).toFixed(2)),
    );
    navigate(tp('/pagamento'));
  };

  if (done && selectedOrder) {
    return (
      <div className="max-w-2xl mx-auto py-12 reveal">
        <Breadcrumb items={[{ label: 'Troca' }, { label: 'Concluída' }]} />
        <div className="text-center mt-6">
          <div
            aria-hidden="true"
            className="w-20 h-20 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center mb-6"
          >
            <CheckCircle2 size={40} />
          </div>
          <h1 className="heading-serif text-fluid-h1 mb-3">
            Troca <em className="text-success">finalizada</em>
          </h1>
          <p className="text-ink-5 text-lg mb-8">
            NF de devolução {selectedOrder.id}-DEV · NF de saída {selectedOrder.id}-NEW emitidas em modo cross-channel.
          </p>

          <section className="receipt card p-6 text-left mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
                  Pedido original
                </div>
                <div className="font-mono text-[13px]">{selectedOrder.id}</div>
                <div className="text-[11px] text-ink-5 mt-1">
                  {selectedOrder.customer?.name}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
                  Diferença
                </div>
                <div
                  className={clsx(
                    'font-serif text-2xl font-semibold',
                    diffLabel === 'pagar' && 'text-coral-500',
                    diffLabel === 'receber' && 'text-success',
                    diffLabel === 'mesmo' && 'text-ink-7',
                  )}
                >
                  {diffLabel === 'mesmo' ? 'R$ 0,00' : formatBRL(Math.abs(diff))}
                </div>
                <div className="text-[11px] text-ink-5 mt-1">
                  {diffLabel === 'pagar' && 'cliente paga'}
                  {diffLabel === 'receber' && 'crédito Vivara liberado'}
                  {diffLabel === 'mesmo' && 'sem diferença'}
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate(tp('/'))}
              className="btn-primary btn-lg"
            >
              Voltar ao atendimento
            </button>
            {diffLabel === 'pagar' && (
              <button
                type="button"
                onClick={handleChargeDifference}
                className="btn-secondary btn-lg"
              >
                Cobrar diferença
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 reveal">
      <Breadcrumb items={[{ label: 'Troca · Cross-channel' }]} />
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn-tertiary self-start p-0"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Voltar
      </button>

      <header>
        <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2 flex items-center gap-2">
          <Globe size={14} aria-hidden="true" /> Omnichannel · EP-02-F5
        </div>
        <h1 className="heading-serif text-fluid-h1 mb-2">
          Troca <em className="text-coral-500">cross-channel</em>
        </h1>
        <p className="text-ink-5 text-base max-w-2xl">
          Cliente compra online ou em outra loja, troca aqui. NF de devolução + NF de saída via OMS · prazo de 7 dias para arrependimento.
        </p>
      </header>

      {/* Stepper */}
      <ol className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-cta font-bold">
        {(
          [
            { id: 'lookup', label: '1. Localizar pedido' },
            { id: 'select', label: '2. Selecionar peças' },
            { id: 'replacement', label: '3. Peça substituta' },
            { id: 'summary', label: '4. Resumo' },
          ] as const
        ).map((s, idx) => {
          const order = ['lookup', 'select', 'replacement', 'summary'];
          const isActive = step === s.id;
          const isPast = order.indexOf(step) > idx;
          return (
            <li
              key={s.id}
              className={clsx(
                'px-3 py-2 border',
                isActive && 'bg-coral-500 text-white border-coral-500',
                isPast && 'bg-ink-7 text-white border-ink-7',
                !isActive && !isPast && 'border-border text-ink-5',
              )}
            >
              {s.label}
            </li>
          );
        })}
      </ol>

      {/* STEP 1 · Lookup */}
      {step === 'lookup' && (
        <form onSubmit={onLookup} className="card p-5 md:p-6 space-y-4" noValidate>
          <div className="field">
            <label htmlFor="query">Buscar pedido</label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4"
                aria-hidden="true"
              />
              <input
                id="query"
                type="text"
                placeholder="CPF · nº NF · e-mail · nome..."
                aria-required="true"
                aria-invalid={!!errors.query}
                aria-describedby={errors.query ? 'query-error' : 'query-help'}
                className="input pl-12"
                autoFocus
                {...register('query')}
              />
            </div>
            {errors.query ? (
              <p id="query-error" role="alert" className="text-[12px] text-danger mt-1">
                {errors.query.message}
              </p>
            ) : (
              <p id="query-help" className="text-[11px] text-ink-5 mt-1">
                Use CPF (ex: 123.456.789-00) · número da NF · e-mail do cliente
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                />
                Consultando OMS…
              </>
            ) : (
              <>
                <Search size={14} aria-hidden="true" />
                Localizar pedido
              </>
            )}
          </button>

          <div className="bg-coral-50 border border-coral-200 p-4 text-[12px] text-ink-6">
            <strong className="text-[11px] uppercase tracking-cta block mb-1 text-coral-500">
              Mock para demo
            </strong>
            Tente CPF do cliente Diamond · ou parte do nome ("Maria") para ver pedidos cross-channel.
          </div>
        </form>
      )}

      {/* STEP 2 · Select items */}
      {step === 'select' && (
        <section className="space-y-4">
          {!selectedOrder && foundOrders.length > 1 && (
            <div className="card p-5 space-y-3">
              <h2 className="heading-serif text-fluid-h3">
                {foundOrders.length} pedidos encontrados
              </h2>
              {foundOrders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOrder(o)}
                  className="w-full text-left card p-4 hover:bg-coral-50 transition flex items-center gap-4"
                >
                  <div
                    aria-hidden="true"
                    className="w-12 h-12 bg-ink-1 flex items-center justify-center"
                  >
                    <Package size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[12px] text-ink-5">{o.id}</div>
                    <div className="font-semibold truncate">{o.customer?.name}</div>
                    <div className="text-[11px] text-ink-5">
                      {new Date(o.createdAt).toLocaleDateString('pt-BR')} ·{' '}
                      {maskCpf(o.customer?.cpf ?? '')} · {o.items.length} peça(s)
                    </div>
                  </div>
                  <div className="font-bold text-right">{formatBRL(o.total)}</div>
                </button>
              ))}
            </div>
          )}

          {selectedOrder && (
            <>
              <div className="bg-coral-50 border border-coral-200 p-4">
                <div className="text-[10px] uppercase tracking-label text-coral-500 font-bold mb-1">
                  Pedido localizado
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-7">
                  <span className="font-mono font-bold">{selectedOrder.id}</span>
                  <span>· {selectedOrder.customer?.name}</span>
                  <span>· {new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}</span>
                  <span>· {formatBRL(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="card">
                <div className="p-4 md:p-5 border-b border-border">
                  <h2 className="heading-serif text-fluid-h3">Selecione peças para devolver</h2>
                  <p className="text-[12px] text-ink-5 mt-1">
                    Selecione no mínimo 1 peça · prazo de 7 dias respeitado em modo automático.
                  </p>
                </div>
                {selectedOrder.items.map((item, idx) => {
                  const checked = returnedItems.has(item.product.sku);
                  return (
                    <label
                      key={item.product.id}
                      className={clsx(
                        'p-4 md:p-5 flex items-center gap-4 cursor-pointer transition',
                        idx < selectedOrder.items.length - 1 && 'border-b border-border-light',
                        checked && 'bg-coral-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(item.product.sku)}
                        className="w-5 h-5 accent-coral-500"
                      />
                      <div
                        aria-hidden="true"
                        className="w-16 h-16 bg-ink-1 flex-shrink-0 overflow-hidden"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink-7 truncate">{item.product.name}</div>
                        <div className="text-[11px] text-ink-5 font-mono mt-0.5">
                          {item.product.sku} · {item.product.metal}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatBRL(item.product.price * item.quantity)}
                        </div>
                        <div className="text-[11px] text-ink-5">qtd. {item.quantity}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setReturnedItems(new Set());
                    reset();
                    setStep('lookup');
                  }}
                  className="btn-tertiary p-0"
                >
                  Trocar pedido
                </button>
                <button
                  type="button"
                  disabled={returnedItems.size === 0}
                  onClick={() => setStep('replacement')}
                  className="btn-primary"
                >
                  Continuar · {returnedItems.size} peça{returnedItems.size === 1 ? '' : 's'} ·{' '}
                  {formatBRL(returnedTotal)}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* STEP 3 · Replacement */}
      {step === 'replacement' && (
        <section className="space-y-4">
          <div className="bg-ink-1 border border-border p-4 flex items-center gap-3 flex-wrap">
            <RefreshCw size={16} aria-hidden="true" className="text-coral-500" />
            <span className="text-[12px] text-ink-7">
              Crédito disponível: <strong>{formatBRL(returnedTotal)}</strong> · escolha uma peça da
              mesma categoria ou pague/receba diferença.
            </span>
          </div>

          {recommendedReplacements.length === 0 ? (
            <EmptyState
              illustration="search"
              title="Sem peças sugeridas"
              description="Use o catálogo completo para escolher qualquer peça da rede (Endless Aisle)."
              primaryAction={
                <button
                  type="button"
                  onClick={() => navigate(tp('/catalogo'))}
                  className="btn-primary"
                >
                  Abrir catálogo
                </button>
              }
            />
          ) : (
            <div
              role="radiogroup"
              aria-label="Peça substituta"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3"
            >
              {recommendedReplacements.map((p) => {
                const selected = replacement?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setReplacement(p)}
                    className={clsx(
                      'card p-3 text-left transition',
                      selected
                        ? 'border-coral-500 bg-coral-50 ring-2 ring-coral-500/20'
                        : 'hover:bg-ink-1',
                    )}
                  >
                    <div className="aspect-square bg-ink-1 mb-2 overflow-hidden">
                      <img
                        src={p.imageUrl}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <div className="text-[12px] font-medium text-ink-7 line-clamp-2">{p.name}</div>
                    <div className="text-[11px] text-ink-5 font-mono">{p.sku}</div>
                    <div className="font-bold text-coral-500 mt-1">{formatBRL(p.price)}</div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="btn-tertiary p-0"
            >
              Voltar
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setReplacement(null);
                  setStep('summary');
                }}
                className="btn-secondary btn-sm"
              >
                Devolver sem trocar
              </button>
              <button
                type="button"
                disabled={!replacement}
                onClick={() => setStep('summary')}
                className="btn-primary"
              >
                Continuar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 4 · Summary */}
      {step === 'summary' && selectedOrder && (
        <section className="space-y-4">
          <div className="card p-5 md:p-6">
            <h2 className="heading-serif text-fluid-h3 mb-4">Resumo da troca</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-ink-1 p-4">
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-1">
                  Pedido devolvido
                </div>
                <div className="font-mono text-[12px]">{selectedOrder.id}</div>
                <div className="text-[12px] mt-2">
                  <strong>{returnedItems.size}</strong> peça{returnedItems.size === 1 ? '' : 's'} ·{' '}
                  {formatBRL(returnedTotal)}
                </div>
              </div>
              <div className="bg-coral-50 p-4">
                <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-1">
                  Peça substituta
                </div>
                {replacement ? (
                  <>
                    <div className="text-[12px] font-medium">{replacement.name}</div>
                    <div className="text-[12px] mt-2">{formatBRL(replacement.price)}</div>
                  </>
                ) : (
                  <div className="text-[12px] text-ink-5 italic">Sem substituição · só devolução</div>
                )}
              </div>
            </div>

            <div
              className={clsx(
                'p-4 border-l-4',
                diffLabel === 'pagar' && 'bg-warning-light border-warning',
                diffLabel === 'receber' && 'bg-success/5 border-success',
                diffLabel === 'mesmo' && 'bg-ink-1 border-ink-7',
              )}
            >
              <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-1">
                Diferença
              </div>
              <div
                className={clsx(
                  'font-serif text-3xl font-semibold',
                  diffLabel === 'pagar' && 'text-warning',
                  diffLabel === 'receber' && 'text-success',
                  diffLabel === 'mesmo' && 'text-ink-7',
                )}
              >
                {diffLabel === 'pagar' && `Cliente paga ${formatBRL(diff)}`}
                {diffLabel === 'receber' && `Cliente recebe ${formatBRL(Math.abs(diff))}`}
                {diffLabel === 'mesmo' && 'Sem diferença'}
              </div>
              {diffLabel === 'receber' && (
                <p className="text-[12px] text-ink-6 mt-2 flex items-center gap-2">
                  <AlertTriangle size={12} aria-hidden="true" />
                  Crédito Vivara liberado · validade 12 meses · usar online ou em loja.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('replacement')}
              className="btn-tertiary p-0"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="btn-primary btn-lg"
            >
              <ShoppingBag size={14} aria-hidden="true" />
              Confirmar troca
            </button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        tone="info"
        title="Confirmar troca cross-channel?"
        description="Será emitida NF de devolução e, se houver substituição, NF de saída."
        body={
          <ul className="text-[12px] text-ink-6 space-y-1.5 list-disc pl-4">
            <li>Pedido original continuará no histórico do cliente</li>
            <li>Estoque liberado em tempo real (LI-03 inventário vivo)</li>
            <li>Audit trail SAP S/4HANA Retail · operação cross-channel</li>
          </ul>
        }
        confirmLabel="Emitir NFs"
      />
    </div>
  );
}
