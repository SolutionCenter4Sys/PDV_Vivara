import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Wallet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Loader2,
  ShieldCheck,
  X,
  TrendingUp,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { formatBRL, formatBRLDecimal, maskCpf } from '@/utils/format';

/**
 * EP-01-F6 · Crediário Vivara · solicitação + simulação.
 *
 * Mock fluxo:
 *   1. Buscar/validar cliente por CPF (consulta CDP + bureaus em ~2s)
 *   2. Aprovar limite com base em mock score
 *   3. Simular plano (12x sem juros até limite, depois 2-3% am)
 *   4. Confirmar e gerar contrato CDC
 */

const CPF_RE = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

const cpfSchema = z.object({
  cpf: z.string().regex(CPF_RE, 'CPF inválido · use 000.000.000-00'),
});
type CpfForm = z.infer<typeof cpfSchema>;

interface CreditAnalysis {
  cpf: string;
  status: 'approved' | 'partial' | 'declined';
  approvedLimit: number;
  serasaScore: number;
  cdpStatus: 'cliente' | 'novo';
  ticketSuggestion: number;
  notes?: string;
}

function mockAnalyze(cpf: string): CreditAnalysis {
  const seed = cpf.replace(/\D/g, '').split('').reduce((s, c) => s + parseInt(c, 10), 0);
  const score = 350 + (seed * 7) % 600;
  if (score < 500) {
    return {
      cpf,
      status: 'declined',
      approvedLimit: 0,
      serasaScore: score,
      cdpStatus: 'novo',
      ticketSuggestion: 0,
      notes: 'Score Serasa abaixo do mínimo de 500 · sugerir cartão à vista ou PIX.',
    };
  }
  if (score < 700) {
    return {
      cpf,
      status: 'partial',
      approvedLimit: 1500 + (seed % 1500),
      serasaScore: score,
      cdpStatus: 'novo',
      ticketSuggestion: 800,
      notes: 'Aprovado com limite reduzido · solicitar comprovante de renda extra para liberar mais.',
    };
  }
  return {
    cpf,
    status: 'approved',
    approvedLimit: 5000 + (seed % 25000),
    serasaScore: score,
    cdpStatus: seed % 3 === 0 ? 'cliente' : 'novo',
    ticketSuggestion: 2500,
  };
}

export function CrediarioPage() {
  const [analysis, setAnalysis] = useState<CreditAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [purchaseValue, setPurchaseValue] = useState(0);
  const [installments, setInstallments] = useState(6);
  const [confirmed, setConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CpfForm>({
    resolver: zodResolver(cpfSchema),
    defaultValues: { cpf: '' },
  });

  const onAnalyze = handleSubmit(async (data) => {
    setAnalyzing(true);
    setAnalysis(null);
    setConfirmed(false);
    await new Promise((r) => setTimeout(r, 1800));
    const result = mockAnalyze(data.cpf);
    setAnalysis(result);
    setPurchaseValue(result.ticketSuggestion);
    setAnalyzing(false);
    if (result.status === 'declined') {
      toast.error('Crediário negado', { description: result.notes });
    } else if (result.status === 'partial') {
      toast.warning('Aprovado com restrições', { description: result.notes });
    } else {
      toast.success(`Limite aprovado: ${formatBRL(result.approvedLimit)}`);
    }
  });

  const installmentValue = purchaseValue > 0 && installments > 0 ? purchaseValue / installments : 0;
  const interestRate = installments > 6 ? 0.029 : 0; // 2.9% a.m. acima de 6x · mock
  const totalWithInterest = purchaseValue * (1 + interestRate * (installments > 6 ? installments - 6 : 0));
  const totalInterest = totalWithInterest - purchaseValue;

  const installmentOptions = useMemo(() => {
    const max = analysis?.approvedLimit ?? 0;
    const exceeds = purchaseValue > max;
    return [1, 2, 3, 6, 10, 12, 18, 24].map((n) => ({
      n,
      value: purchaseValue / n,
      hasInterest: n > 6,
      exceeds,
    }));
  }, [purchaseValue, analysis]);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Pagamento', to: '/pagamento' }, { label: 'Crediário Vivara' }]} />

      <header className="mb-6 flex items-start gap-3">
        <div className="bg-coral-500 text-white w-12 h-12 flex items-center justify-center flex-shrink-0">
          <Wallet size={24} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
            EP-01-F6 · Crediário próprio
          </p>
          <h1 className="heading-serif text-fluid-h1">Crediário Vivara</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            Análise de crédito CDC online · até 24x · 12x sem juros · taxa 2,9% a.m. acima de 6x.
          </p>
        </div>
      </header>

      <section className="card p-4 mb-5" aria-labelledby="cpf-h">
        <h2 id="cpf-h" className="font-serif text-xl font-semibold mb-3 inline-flex items-center gap-2">
          <Search size={18} aria-hidden="true" className="text-coral-500" />
          1. Solicitação · análise de CPF
        </h2>
        <form onSubmit={onAnalyze} className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              CPF do cliente
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              {...register('cpf')}
              className={clsx('input font-mono', errors.cpf && 'border-danger')}
              aria-invalid={errors.cpf ? 'true' : 'false'}
            />
            {errors.cpf && (
              <p className="text-[11px] text-danger mt-1" role="alert">
                {errors.cpf.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={analyzing}
            className="btn-primary inline-flex items-center gap-2 min-h-[44px]"
          >
            {analyzing ? (
              <Loader2 size={14} aria-hidden="true" className="animate-spin" />
            ) : (
              <ShieldCheck size={14} aria-hidden="true" />
            )}
            {analyzing ? 'Consultando bureaus...' : 'Analisar crédito'}
          </button>
        </form>
        {analyzing && (
          <div className="mt-3 text-[11px] text-ink-5 inline-flex items-center gap-2">
            <Loader2 size={11} className="animate-spin" aria-hidden="true" />
            CDP Vivara · Serasa · SPC · Boa Vista · ~2s
          </div>
        )}
      </section>

      {analysis && (
        <>
          <section
            className={clsx(
              'card p-4 mb-5 border-l-4',
              analysis.status === 'approved' && 'border-success bg-success/5',
              analysis.status === 'partial' && 'border-warning bg-warning-light',
              analysis.status === 'declined' && 'border-danger bg-danger/5',
            )}
            aria-labelledby="analysis-h"
          >
            <h2
              id="analysis-h"
              className="font-serif text-xl font-semibold mb-3 inline-flex items-center gap-2"
            >
              {analysis.status === 'approved' && (
                <CheckCircle2 size={18} aria-hidden="true" className="text-success" />
              )}
              {analysis.status === 'partial' && (
                <AlertTriangle size={18} aria-hidden="true" className="text-warning" />
              )}
              {analysis.status === 'declined' && (
                <X size={18} aria-hidden="true" className="text-danger" />
              )}
              2. Resultado da análise
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
              <div className="border border-border bg-white p-3">
                <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">CPF</div>
                <div className="font-mono">{maskCpf(analysis.cpf)}</div>
              </div>
              <div className="border border-border bg-white p-3">
                <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">
                  Score Serasa
                </div>
                <div className="font-mono text-base font-bold tabular-nums">
                  {analysis.serasaScore}
                </div>
              </div>
              <div className="border border-border bg-white p-3">
                <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">
                  Vivara CDP
                </div>
                <div className="font-bold capitalize">{analysis.cdpStatus}</div>
              </div>
              <div className="border border-border bg-white p-3">
                <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1">
                  Limite aprovado
                </div>
                <div className="font-serif text-lg font-bold text-coral-500 tabular-nums">
                  {formatBRL(analysis.approvedLimit)}
                </div>
              </div>
            </div>
            {analysis.notes && (
              <p className="text-[12px] text-ink-7 mt-3 bg-white border border-border p-3">
                {analysis.notes}
              </p>
            )}
          </section>

          {analysis.status !== 'declined' && (
            <section className="card p-4 mb-5" aria-labelledby="sim-h">
              <h2
                id="sim-h"
                className="font-serif text-xl font-semibold mb-3 inline-flex items-center gap-2"
              >
                <Calculator size={18} aria-hidden="true" className="text-coral-500" />
                3. Plano de pagamento · simulador
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
                    Valor da compra
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={analysis.approvedLimit}
                    step="50"
                    value={purchaseValue}
                    onChange={(e) => setPurchaseValue(Number(e.target.value))}
                    className="input font-mono tabular-nums"
                    aria-describedby="purchase-help"
                  />
                  <p id="purchase-help" className="text-[10px] text-ink-5 mt-1">
                    Limite disponível: {formatBRL(analysis.approvedLimit)}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
                    Parcelas
                  </label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="input"
                  >
                    {installmentOptions.map((opt) => (
                      <option key={opt.n} value={opt.n} disabled={opt.exceeds}>
                        {opt.n}x · {formatBRLDecimal(opt.value)}
                        {opt.hasInterest ? ' (c/ juros)' : ' sem juros'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Parcela" value={formatBRLDecimal(installmentValue)} highlight />
                <Stat
                  label="Juros total"
                  value={formatBRL(totalInterest)}
                  tone={totalInterest > 0 ? 'warning' : 'success'}
                />
                <Stat label="Total a pagar" value={formatBRL(totalWithInterest)} />
                <Stat label="Taxa a.m." value={`${(interestRate * 100).toFixed(1)}%`} />
              </div>

              {purchaseValue > analysis.approvedLimit && (
                <p className="mt-3 text-[12px] text-danger inline-flex items-center gap-2">
                  <AlertTriangle size={12} aria-hidden="true" />
                  Valor excede o limite aprovado · reduza ou solicite reanalise.
                </p>
              )}

              <div className="border-t border-border-light pt-3 mt-4 flex justify-end gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setAnalysis(null);
                    reset();
                  }}
                  className="btn-tertiary inline-flex items-center gap-1"
                >
                  <X size={14} aria-hidden="true" />
                  Nova consulta
                </button>
                <button
                  type="button"
                  disabled={
                    purchaseValue <= 0 ||
                    purchaseValue > analysis.approvedLimit ||
                    confirmed
                  }
                  onClick={() => {
                    setConfirmed(true);
                    toast.success('Crediário aprovado e contratado', {
                      description: `${installments}x · ${formatBRLDecimal(installmentValue)} · contrato CDC enviado por e-mail.`,
                    });
                  }}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <CheckCircle2 size={14} aria-hidden="true" />
                  {confirmed ? 'Contrato gerado' : 'Confirmar crediário'}
                </button>
              </div>
              {confirmed && (
                <div className="mt-3 bg-success/5 border border-success/30 p-3 text-[12px] inline-flex items-start gap-2 w-full">
                  <CheckCircle2
                    size={14}
                    aria-hidden="true"
                    className="text-success mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <strong>Contrato CDC nº {Date.now().toString(36).toUpperCase()}</strong>{' '}
                    gerado · vinculado ao SAP S/4HANA · primeira parcela em 30 dias.
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}

      <footer className="text-[10px] uppercase tracking-cta text-ink-4 border-t border-border pt-3">
        Vivara CDC · sociedade de crédito SCFI · CNPJ 12.345.678/0001-99 · regulado BACEN.
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'danger';
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        'border border-border bg-white p-3',
        highlight && 'bg-coral-50 border-coral-300',
      )}
    >
      <div className="text-[10px] uppercase tracking-cta text-ink-5 mb-1 inline-flex items-center gap-1">
        {highlight && <TrendingUp size={10} aria-hidden="true" />}
        {label}
      </div>
      <div
        className={clsx(
          'font-serif text-lg font-bold tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-danger',
          highlight && 'text-coral-500',
          !tone && !highlight && 'text-ink-7',
        )}
      >
        {value}
      </div>
    </div>
  );
}
