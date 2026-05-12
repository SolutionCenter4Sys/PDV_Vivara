import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  Smartphone,
  Wallet,
  Shield,
  CheckCircle2,
  FileText,
  CloudOff,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import clsx from 'clsx';
import { usePosStore } from '@/store/usePosStore';
import { formatBRL, formatBRLDecimal } from '@/utils/format';
import type { PaymentMethod } from '@/types';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ManagerApprovalDialog } from '@/components/ManagerApprovalDialog';
import { BiometricFraudDialog } from '@/components/BiometricFraudDialog';
import { PixQrDialog } from '@/components/PixQrDialog';
import { TefProgressDialog } from '@/components/TefProgressDialog';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { orders } from '@/data/mocks';
import type { Order } from '@/types';

const METHODS: { id: PaymentMethod; label: string; icon: typeof CreditCard; description: string }[] = [
  { id: 'credit', label: 'Crédito', icon: CreditCard, description: 'Stone · Cielo · Rede com fallback' },
  { id: 'debit', label: 'Débito', icon: CreditCard, description: 'TEF nacional' },
  { id: 'pix', label: 'PIX', icon: QrCode, description: 'BACEN · liquidação imediata' },
  { id: 'apple_pay', label: 'Apple Pay', icon: Smartphone, description: 'Carteira digital · NFC' },
  { id: 'crediario', label: 'Crediário Vivara', icon: Wallet, description: 'Em até 12x sem juros' },
];

export function PaymentPage() {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const { cart, cartSubtotal, cartDiscount, cartTotal, clearCart, activeCustomer, seller } = usePosStore();
  const offline = usePosStore(s => s.offline);
  const persistedOrderRef = useRef<Order | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('credit');
  const [installments, setInstallments] = useState(6);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [contingencia, setContingencia] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [contingencyConfirmOpen, setContingencyConfirmOpen] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [tefOpen, setTefOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);

  const total = cartTotal();
  const installmentsValue = total / installments;

  // EP-04-F5 · Anti-fraude PDV-nativo · score determinístico para mock
  const fraudScore = (() => {
    const valueWeight = total > 8000 ? 0.18 : total > 4000 ? 0.08 : 0.02;
    const customerWeight = activeCustomer ? 0 : 0.06;
    const offlineWeight = offline ? 0.12 : 0;
    const baseRisk = 0.05;
    return Number((baseRisk + valueWeight + customerWeight + offlineWeight).toFixed(2));
  })();
  const fraudLevel: 'safe' | 'warning' | 'block' =
    fraudScore >= 0.3 ? 'block' : fraudScore >= 0.18 ? 'warning' : 'safe';
  const fraudRequiresApproval = fraudLevel === 'warning' || fraudLevel === 'block';

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-5">Sem itens no carrinho.</p>
        <button onClick={() => navigate(tp('/catalogo'))} className="btn-primary mt-4">Ir ao catálogo</button>
      </div>
    );
  }

  const proceedToPayment = () => {
    setProcessing(true);
    const isContingencia = offline;
    setContingencia(isContingencia);

    if (isContingencia) {
      toast.warning('NFC-e em modo contingência', {
        description:
          'Documento será enviado à SEFAZ ao reconectar · vendedor pode imprimir comprovante de contingência.',
        icon: <CloudOff size={16} aria-hidden="true" />,
      });
    }

    setTimeout(() => {
      if (!persistedOrderRef.current) {
        const fiscalKey = isContingencia
          ? undefined
          : `43${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}`;
        const order: Order = {
          id: `ORD-DEMO-${Date.now()}`,
          customer: activeCustomer ?? undefined,
          items: cart,
          subtotal: cartSubtotal(),
          discount: cartDiscount(),
          total,
          paymentMethod: method,
          installments: method === 'credit' || method === 'crediario' ? installments : undefined,
          storeId: seller?.storeId ?? 'SP-IGUATEMI',
          sellerId: seller?.id ?? 'SEL-001',
          brand: seller?.brand ?? 'vivara',
          createdAt: new Date().toISOString(),
          status: 'paid',
          fiscal: {
            chave: fiscalKey,
            issued: !isContingencia,
            contingencyMode: isContingencia,
          },
        };
        orders.unshift(order);
        persistedOrderRef.current = order;
      }
      setProcessing(false);
      setDone(true);
    }, 2400);
  };

  const handlePay = () => {
    if (fraudLevel === 'warning' && !activeCustomer) {
      // LI-04 · oferecer biométrico como caminho rápido (opt-in)
      setBioOpen(true);
      return;
    }
    if (fraudRequiresApproval) {
      setManagerOpen(true);
      return;
    }
    if (offline) {
      setContingencyConfirmOpen(true);
      return;
    }
    if (method === 'pix') {
      setPixOpen(true);
      return;
    }
    if (method === 'credit' || method === 'debit') {
      setTefOpen(true);
      return;
    }
    proceedToPayment();
  };

  const handlePixApproved = () => {
    setPixOpen(false);
    proceedToPayment();
  };

  const handleTefApproved = () => {
    setTefOpen(false);
    proceedToPayment();
  };

  const handleManagerApproved = () => {
    setManagerOpen(false);
    toast.success('Pagamento autorizado pelo gerente', {
      description: `Anti-fraude LI-04 escalado e liberado · score ${fraudScore} registrado em audit trail.`,
    });
    if (offline) {
      setContingencyConfirmOpen(true);
      return;
    }
    proceedToPayment();
  };

  const handleNew = () => {
    clearCart();
    navigate(tp('/'));
  };

  if (done) {
    const fakeChave = persistedOrderRef.current?.fiscal.chave ?? `43${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}`;
    return (
      <div className="max-w-2xl mx-auto py-12 reveal">
        <Breadcrumb
          items={[
            { label: 'Carrinho', to: '/carrinho' },
            { label: 'Pagamento', to: '/pagamento' },
            { label: 'Venda concluída' },
          ]}
        />
        <div className="text-center mt-6">
        <div
          className={clsx(
            'w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6',
            contingencia ? 'bg-warning-light text-warning' : 'bg-success/15 text-success',
          )}
        >
          {contingencia ? <CloudOff size={40} aria-hidden="true" /> : <CheckCircle2 size={40} aria-hidden="true" />}
        </div>
        <h1 className="heading-serif text-fluid-h1 mb-3">
          Venda <em className={contingencia ? 'text-warning' : 'text-success'}>
            {contingencia ? 'em contingência' : 'finalizada'}
          </em>
        </h1>
        <p className="text-ink-5 text-lg mb-8">
          {contingencia
            ? 'NFC-e em fila local · será enviada à SEFAZ ao reconectar. Comprovante físico já pode ser impresso.'
            : 'Obrigada por mais uma venda. NFC-e emitida com sucesso.'}
        </p>

        <section className="receipt card p-6 text-left mb-6">
          <header className="hidden print:block mb-4 pb-3 border-b border-black">
            <h2 className="font-serif text-xl font-semibold mb-1">
              VIVARA · {contingencia ? 'CUPOM FISCAL ELETRÔNICO · MODO CONTINGÊNCIA' : 'CUPOM FISCAL ELETRÔNICO'}
            </h2>
            <p className="text-xs">{new Date().toLocaleString('pt-BR')}</p>
          </header>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Total</div>
              <div className="font-serif text-2xl font-semibold text-coral-500">{formatBRL(total)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Pagamento</div>
              <div className="font-medium capitalize">
                {METHODS.find(m => m.id === method)?.label}
                {method === 'credit' || method === 'crediario' ? ` · ${installments}x` : ''}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
                NFC-e · {contingencia ? 'chave provisória' : 'chave'}
              </div>
              <div className="font-mono text-[12px] text-ink-7 break-all">{fakeChave}</div>
              {contingencia && (
                <div className="text-[11px] text-warning font-bold mt-1 print:text-black">
                  Status: aguardando SEFAZ · sync em até 24h
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Anti-fraude LI-04</div>
              <div className="font-medium text-success">Score {fraudScore.toFixed(2)} · aprovado em 142ms</div>
            </div>
          </div>
          <footer className="hidden print:block mt-4 pt-3 border-t border-black text-[10pt] text-center">
            <p>Obrigada pela preferência · Vivara</p>
            <p className="mt-1">
              {contingencia
                ? 'Cupom em contingência · NFC-e definitiva será enviada por e-mail ao cliente'
                : 'Consulte sua NFC-e em www.fazenda.sp.gov.br'}
            </p>
          </footer>
        </section>

        {activeCustomer?.optInWhatsapp && (
          <div className="bg-coral-50 border border-coral-200 p-5 mb-6 text-left text-sm">
            <strong>WhatsApp 1:1 enviado</strong> para {activeCustomer.name} com a NFC-e e cuidados da peça. Próxima ação Copilot:
            sugestão de combinação com brincos pendentes em 7 dias (LI-05 Antecipatório).
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={handleNew} className="btn-primary btn-lg">Iniciar nova venda</button>
          <button onClick={() => window.print()} className="btn-secondary btn-lg">
            <FileText size={14} aria-hidden="true" /> Imprimir NFC-e
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 reveal">
      <Breadcrumb
        items={[
          { label: 'Carrinho', to: '/carrinho' },
          { label: 'Pagamento' },
        ]}
      />
      <button onClick={() => navigate(-1)} className="btn-tertiary self-start p-0">
        <ArrowLeft size={14} aria-hidden="true" /> Voltar
      </button>

      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2">
            Pagamento · {cart.length} {cart.length === 1 ? 'peça' : 'peças'}
          </div>
          <h1 className="heading-serif text-fluid-h1">
            Como deseja <em className="text-coral-500">pagar?</em>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Total</div>
          <div className="font-serif text-3xl md:text-4xl font-semibold text-coral-500">{formatBRL(total)}</div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-4 lg:gap-6">
        <div
          role="radiogroup"
          aria-label="Método de pagamento"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3"
        >
          {METHODS.map(m => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              onClick={() => setMethod(m.id)}
              className={clsx(
                'card w-full p-4 flex items-center gap-4 text-left transition min-h-[80px]',
                method === m.id ? 'border-coral-500 bg-coral-50 ring-2 ring-coral-500/20' : 'hover:bg-ink-1',
              )}
            >
              <div className={clsx(
                'w-12 h-12 flex items-center justify-center flex-shrink-0',
                method === m.id ? 'bg-coral-200 text-ink-7' : 'bg-ink-1 text-ink-5'
              )}>
                <m.icon size={20} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-7">{m.label}</div>
                <div className="text-[12px] text-ink-5 truncate">{m.description}</div>
              </div>
              <div
                aria-hidden="true"
                className={clsx(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0',
                  method === m.id ? 'border-coral-500 bg-coral-500' : 'border-ink-3'
                )}
              />
            </button>
          ))}
        </div>

        <div className="space-y-4 lg:sticky lg:top-[96px] lg:self-start">
          {/* Parcelas */}
          {(method === 'credit' || method === 'crediario') && (
            <div className="card p-4">
              <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-2">Parcelas</div>
              <select
                value={installments}
                onChange={e => setInstallments(Number(e.target.value))}
                className="input"
              >
                {[1, 2, 3, 6, 10, 12].map(n => (
                  <option key={n} value={n}>{n}x de {formatBRLDecimal(total / n)} sem juros</option>
                ))}
              </select>
            </div>
          )}

          {/* PIX QR demo */}
          {method === 'pix' && (
            <div className="card p-5 text-center">
              <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-3">PIX QR Code</div>
              <div className="aspect-square bg-ink-7 grid grid-cols-10 grid-rows-10 gap-px p-3 mb-3">
                {Array.from({ length: 100 }, (_, i) => (
                  <div key={i} className={Math.random() > 0.5 ? 'bg-white' : 'bg-ink-7'} />
                ))}
              </div>
              <button className="btn-secondary btn-sm w-full">Copiar código PIX copia-e-cola</button>
            </div>
          )}

          {/* Anti-fraude · score real-time conforme valor + cliente + offline */}
          <div
            role="status"
            aria-live="polite"
            className={clsx(
              'card p-4',
              fraudLevel === 'safe' && 'bg-success/5 border-success/30',
              fraudLevel === 'warning' && 'bg-warning-light border-warning/40',
              fraudLevel === 'block' && 'bg-danger/5 border-danger/30',
            )}
          >
            <div
              className={clsx(
                'flex items-center gap-2 text-[10px] uppercase tracking-label font-bold mb-2',
                fraudLevel === 'safe' && 'text-success',
                fraudLevel === 'warning' && 'text-warning',
                fraudLevel === 'block' && 'text-danger',
              )}
            >
              {fraudLevel === 'block' ? (
                <ShieldAlert size={12} aria-hidden="true" />
              ) : fraudLevel === 'warning' ? (
                <AlertTriangle size={12} aria-hidden="true" />
              ) : (
                <Shield size={12} aria-hidden="true" />
              )}
              Anti-fraude LI-04 · score {fraudScore.toFixed(2)}
              <span className="ml-auto font-mono">142ms</span>
            </div>
            <div className="text-[12px] text-ink-6">
              {fraudLevel === 'safe' && 'Transação segura · liberada para TEF · Featurespace ARIC + modelo Vivara.'}
              {fraudLevel === 'warning' && 'Borderline · será escalado para o gerente para revisão antes da TEF.'}
              {fraudLevel === 'block' && 'Sinal de bloqueio · gerente precisa autorizar manualmente com justificativa.'}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={processing}
            aria-busy={processing}
            className="btn-primary btn-lg w-full"
            aria-label={processing ? 'Processando pagamento via TEF' : `Confirmar pagamento de ${formatBRL(total)}`}
          >
            {processing ? (
              <>
                <span
                  aria-hidden="true"
                  className="inline-block w-4 h-4 border-2 border-ink-7 border-t-transparent rounded-full animate-spin"
                />
                {offline ? 'Processando · contingência' : 'Processando · TEF'}
              </>
            ) : (
              <>{fraudRequiresApproval ? 'Solicitar liberação do gerente' : 'Confirmar pagamento'}</>
            )}
          </button>
        </div>
      </section>

      <ManagerApprovalDialog
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onApproved={handleManagerApproved}
        context={{
          fraudScore,
          fraudLevel,
          total,
          customerName: activeCustomer?.name,
        }}
      />

      <ConfirmDialog
        open={contingencyConfirmOpen}
        onClose={() => setContingencyConfirmOpen(false)}
        onConfirm={() => {
          setContingencyConfirmOpen(false);
          proceedToPayment();
        }}
        tone="warning"
        title="Confirmar venda em contingência"
        description="Sem rede para a SEFAZ. NFC-e será emitida em modo contingência e enviada à autoridade ao reconectar."
        body={
          <ul className="text-[12px] text-ink-6 space-y-1.5 list-disc pl-4">
            <li>Comprovante físico será impresso (cliente recebe)</li>
            <li>NFC-e fica em fila local · sync automático em até 24h</li>
            <li>TEF tenta offline · limite contratual R$ 200 · acima disso operação é abortada</li>
            <li>Auditoria fiscal · transações offline são listadas no Relatório Z</li>
          </ul>
        }
        confirmLabel="Emitir em contingência"
      />

      <BiometricFraudDialog
        open={bioOpen}
        onClose={() => setBioOpen(false)}
        fraudScore={fraudScore}
        onPass={() => {
          setBioOpen(false);
          toast.success('LI-04 · biométrico positivo · liberando transação');
          if (offline) {
            setContingencyConfirmOpen(true);
            return;
          }
          if (method === 'pix') {
            setPixOpen(true);
            return;
          }
          if (method === 'credit' || method === 'debit') {
            setTefOpen(true);
            return;
          }
          proceedToPayment();
        }}
        onFail={() => {
          setBioOpen(false);
          setManagerOpen(true);
        }}
      />

      <PixQrDialog
        open={pixOpen}
        onClose={() => setPixOpen(false)}
        amount={total}
        onApproved={handlePixApproved}
      />

      <TefProgressDialog
        open={tefOpen}
        onClose={() => setTefOpen(false)}
        amount={total}
        installments={method === 'credit' ? installments : 1}
        onApproved={handleTefApproved}
      />
    </div>
  );
}
