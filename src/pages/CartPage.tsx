import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  User,
  Tag,
  Search,
  Award,
  Gift,
} from 'lucide-react';
import clsx from 'clsx';
import { usePosStore } from '@/store/usePosStore';
import { customers } from '@/data/mocks';
import { loyaltyAccounts, POINT_TO_BRL } from '@/data/extendedMocks';
import { formatBRL, formatBRLDecimal } from '@/utils/format';
import { Breadcrumb } from '@/components/Breadcrumb';
import { EmptyState } from '@/components/EmptyState';
import { SmartBagSuggestions } from '@/components/SmartBagSuggestions';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';

export function CartPage() {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const {
    cart,
    activeCustomer,
    selectCustomer,
    updateQuantity,
    removeFromCart,
    applyDiscount,
    cartSubtotal,
    cartDiscount,
    cartTotal,
  } = usePosStore();
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const loyalty = activeCustomer ? loyaltyAccounts[activeCustomer.id] : undefined;
  const demoCustomers = useMemo(() => {
    const newCustomer = customers.find((customer) => customer.id === 'CL-015');
    const regularCustomers = customers
      .filter((customer) => customer.id !== 'CL-015')
      .slice(0, 8);
    return newCustomer ? [newCustomer, ...regularCustomers] : regularCustomers;
  }, []);
  const pointsValue = useMemo(() => pointsToRedeem * POINT_TO_BRL, [pointsToRedeem]);
  const orderTotalAfterPoints = Math.max(0, cartTotal() - pointsValue);

  if (cart.length === 0) {
    return (
      <div className="space-y-8 reveal">
        <Breadcrumb items={[{ label: 'Carrinho' }]} />
        <EmptyState
          illustration="cart"
          title="Carrinho vazio"
          description="Inicie a jornada navegando pelo catálogo, identificando o cliente Diamond ou abrindo uma sugestão do Agente IA."
          primaryAction={
            <button onClick={() => navigate(tp('/catalogo'))} className="btn-primary">
              <Search size={14} aria-hidden="true" /> Ir ao catálogo
            </button>
          }
          secondaryAction={
            <button onClick={() => navigate(tp('/'))} className="btn-secondary">
              Identificar cliente
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 reveal">
      <Breadcrumb items={[{ label: 'Carrinho' }]} />
      <button onClick={() => navigate(-1)} className="btn-tertiary self-start p-0">
        <ArrowLeft size={14} aria-hidden="true" /> Voltar
      </button>

      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2">
            Checkout · {cart.length} {cart.length === 1 ? 'peça' : 'peças'}
          </div>
          <h1 className="heading-serif text-fluid-h1">
            Finalizando <em className="text-coral-500">venda</em>
          </h1>
        </div>
      </header>

      {/* Cliente */}
      <section className="card p-5">
        <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-3 flex items-center gap-2">
          <User size={12} /> Cliente vinculado à venda
        </div>
        {activeCustomer ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-ink-7 text-white flex items-center justify-center font-serif text-lg font-semibold">
                {activeCustomer.name.split(' ').slice(0,2).map(p => p.charAt(0)).join('')}
              </div>
              <div>
                <div className="font-semibold">{activeCustomer.name}</div>
                <div className="text-[11px] text-ink-5">LTV {formatBRL(activeCustomer.totalLTV)} · {activeCustomer.totalOrders} pedidos</div>
              </div>
            </div>
            <button onClick={() => selectCustomer(null)} className="btn-tertiary p-0">Trocar cliente</button>
          </div>
        ) : (
          <button onClick={() => setShowCustomerPicker(!showCustomerPicker)} className="btn-secondary btn-sm">
            Identificar cliente
          </button>
        )}
        {showCustomerPicker && !activeCustomer && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {demoCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => { selectCustomer(c); setShowCustomerPicker(false); }}
                className="text-left p-3 border border-border hover:bg-coral-50 transition flex items-center gap-3 min-h-[60px]"
              >
                <div className="w-10 h-10 rounded-full bg-coral-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {c.name}
                    {c.totalOrders === 0 && (
                      <span className="ml-2 tag bg-success text-white align-middle">novo</span>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-5">{c.tier.toUpperCase()} · LTV {formatBRL(c.totalLTV)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* EP-03-F4 · Resgate fidelidade · só aparece com cliente ativo + pontos */}
      {activeCustomer && loyalty && loyalty.points > 0 && (
        <section className="card p-5 bg-gold/5 border-gold/30">
          <div className="flex items-start gap-3 flex-wrap">
            <div
              aria-hidden="true"
              className="w-12 h-12 bg-gold text-white flex items-center justify-center flex-shrink-0"
            >
              <Award size={20} />
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="text-[10px] uppercase tracking-label font-bold text-gold mb-1 flex items-center gap-2">
                <Gift size={11} aria-hidden="true" /> Programa fidelidade Vivara
              </div>
              <h3 className="font-serif text-lg md:text-xl text-ink-7">
                {loyalty.points.toLocaleString('pt-BR')} pontos disponíveis
              </h3>
              <p className="text-[12px] text-ink-5 mt-1">
                Equivale a até{' '}
                <strong className="text-gold">{formatBRL(loyalty.points * POINT_TO_BRL)}</strong> ·{' '}
                expira {new Date(loyalty.expiresAt).toLocaleDateString('pt-BR')}
              </p>
              {loyalty.nextTier && (
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="flex-1 h-1.5 bg-ink-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(loyalty.tierProgress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progresso até ${loyalty.nextTier}`}
                  >
                    <div
                      className="h-full bg-gold transition-all"
                      style={{ width: `${loyalty.tierProgress * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-ink-5 font-bold uppercase tracking-cta">
                    {Math.round(loyalty.tierProgress * 100)}% para {loyalty.nextTier}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="field mb-0">
              <label htmlFor="pointsRedeem" className="text-[11px]">
                Resgatar pontos · max {Math.min(loyalty.points, Math.floor(cartTotal() / POINT_TO_BRL)).toLocaleString('pt-BR')}
              </label>
              <input
                id="pointsRedeem"
                type="number"
                min={0}
                max={Math.min(loyalty.points, Math.floor(cartTotal() / POINT_TO_BRL))}
                step={500}
                inputMode="numeric"
                value={pointsToRedeem}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(Number(e.target.value), loyalty.points));
                  const cap = Math.floor(cartTotal() / POINT_TO_BRL);
                  setPointsToRedeem(Math.min(v, cap));
                }}
                className="input"
                aria-describedby="pointsRedeem-help"
              />
              <p id="pointsRedeem-help" className="text-[11px] text-ink-5 mt-1">
                {pointsToRedeem > 0 ? (
                  <>
                    {pointsToRedeem.toLocaleString('pt-BR')} pontos = <strong>{formatBRL(pointsValue)}</strong> de desconto
                  </>
                ) : (
                  'Use múltiplos de 500 pontos · 1 ponto = R$ 0,02'
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPointsToRedeem(0)}
                disabled={pointsToRedeem === 0}
                className="btn-tertiary p-0 text-[11px]"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  const max = Math.min(loyalty.points, Math.floor(cartTotal() / POINT_TO_BRL));
                  const rounded = Math.floor(max / 500) * 500;
                  setPointsToRedeem(rounded);
                  toast.success(`${rounded.toLocaleString('pt-BR')} pontos aplicados`, {
                    description: `Desconto de ${formatBRL(rounded * POINT_TO_BRL)} sobre o total.`,
                  });
                }}
                className="btn-primary"
              >
                Aplicar máximo
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Sacola Inteligente · Agente IA · cross-sell em tempo real */}
      <SmartBagSuggestions />

      {/* Itens */}
      <section className="card">
        {cart.map((item, idx) => (
          <div
            key={item.product.id}
            className={`p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 ${idx < cart.length - 1 ? 'border-b border-border-light' : ''}`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-ink-1 flex-shrink-0 overflow-hidden">
              <img
                src={item.product.imageUrl}
                alt={item.product.imageAlt || item.product.name}
                loading="lazy"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="flex-1 min-w-0 basis-[60%] sm:basis-auto">
              <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-1">
                {item.product.collection || item.product.brand.toUpperCase()}
              </div>
              <div className="font-medium text-ink-7">{item.product.name}</div>
              <div className="text-[11px] text-ink-5 font-mono mt-1">
                {item.product.sku} · {item.product.weightG}g · {item.product.metal}
              </div>
              {item.customDiscountPct ? (
                <div className="text-[11px] text-success mt-1 flex items-center gap-1">
                  <Tag size={11} /> Desconto contextual {item.customDiscountPct}% (LI-09)
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                className="w-11 h-11 border border-border hover:bg-coral-50 flex items-center justify-center transition"
                aria-label={`Diminuir quantidade de ${item.product.name}`}
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span
                className="w-10 text-center font-bold tabular-nums"
                aria-live="polite"
                aria-label={`Quantidade ${item.quantity}`}
              >
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                className="w-11 h-11 border border-border hover:bg-coral-50 flex items-center justify-center transition"
                aria-label={`Aumentar quantidade de ${item.product.name}`}
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="text-right min-w-[100px]">
              <div className="font-bold text-ink-7">{formatBRL(item.product.price * item.quantity)}</div>
              <div className="flex gap-2 mt-1 items-center justify-end">
                <button
                  type="button"
                  onClick={() => applyDiscount(item.product.id, item.customDiscountPct ? 0 : 5)}
                  className="min-h-[44px] px-3 text-[10px] uppercase tracking-cta font-bold text-coral-500 hover:text-coral-dark-02"
                  title="Desconto contextual LI-09"
                >
                  {item.customDiscountPct ? '-Desconto' : '+5%'}
                </button>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="w-11 h-11 inline-flex items-center justify-center text-ink-4 hover:text-danger hover:bg-danger/5 transition"
                  aria-label={`Remover ${item.product.name} do carrinho`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Totais · em tablet portrait empilha (Total fica em destaque), em landscape lado a lado */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 lg:gap-6">
        <div className="card p-4 md:p-5 order-2 lg:order-1">
          <h3 className="font-serif text-lg md:text-xl font-semibold mb-3">Resumo fiscal</h3>
          <ul className="text-sm space-y-2 text-ink-6">
            <li>NFC-e será emitida ao confirmar pagamento</li>
            <li>Modo: <span className="text-success font-medium">Online · ambiente fiscal homologado</span></li>
            <li>CBS/IBS aplicado conforme nova alíquota</li>
            <li>Anti-fraude LI-04 ativo · score em &lt;200ms</li>
          </ul>
        </div>
        <div className="card p-4 md:p-5 bg-coral-50 border-coral-200 order-1 lg:order-2 lg:sticky lg:top-[96px] lg:self-start">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-6">Subtotal</span>
              <span className="tabular-nums">{formatBRL(cartSubtotal())}</span>
            </div>
            {cartDiscount() > 0 && (
              <div className="flex justify-between text-success">
                <span>Desconto contextual</span>
                <span className="tabular-nums">− {formatBRL(cartDiscount())}</span>
              </div>
            )}
            {pointsValue > 0 && (
              <div className="flex justify-between text-gold">
                <span className="flex items-center gap-1">
                  <Award size={11} aria-hidden="true" />
                  Pontos resgatados
                </span>
                <span className="tabular-nums">− {formatBRL(pointsValue)}</span>
              </div>
            )}
            <div className="border-t border-border my-3" />
            <div className="flex justify-between items-center gap-3">
              <span className="font-serif text-lg md:text-xl font-semibold">Total</span>
              <span
                className={clsx(
                  'font-serif text-2xl md:text-3xl lg:text-4xl font-semibold tabular-nums',
                  pointsValue > 0 ? 'text-gold' : 'text-coral-500',
                )}
              >
                {formatBRL(orderTotalAfterPoints)}
              </span>
            </div>
            <div className="text-[11px] text-ink-5 text-right">
              ou 10x sem juros de {formatBRLDecimal(orderTotalAfterPoints / 10)}
            </div>
          </div>
          <button
            type="button"
                onClick={() => navigate(tp('/pagamento'))}
            className="btn-primary btn-lg w-full mt-4"
            aria-label={`Ir ao pagamento · ${formatBRL(orderTotalAfterPoints)}`}
          >
            Ir ao pagamento
          </button>
        </div>
      </section>
    </div>
  );
}
