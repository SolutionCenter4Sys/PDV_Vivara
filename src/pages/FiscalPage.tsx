import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileX,
  FileText,
  Search,
  Printer,
  Lock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { orders, sellers } from '@/data/mocks';
import { formatBRL } from '@/utils/format';
import type { Order } from '@/types';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ManagerApprovalDialog } from '@/components/ManagerApprovalDialog';
import { usePosStore } from '@/store/usePosStore';

/**
 * EP-01-F3 · NFC-e / SAT Homologado
 *
 * F3-FE-02 · Tela de cancelamento fiscal · justificativa + autorização do gerente
 * F3-FE-03 · Relatório Z · resumo do dia por estação
 *
 * Janela de cancelamento legal: 30 minutos da emissão (pelo modelo Vivara · maioria dos
 * estados aceita esse prazo). Após isso, exige NF de devolução (ver EP-02-F5).
 */

type Tab = 'cancelar' | 'relatorio-z';

const cancelSchema = z.object({
  nfceKey: z
    .string()
    .min(8, 'Informe a chave de acesso (44 dígitos) ou número da NFC-e')
    .max(44, 'Chave inválida'),
  justification: z
    .string()
    .min(15, 'Justificativa precisa ter ao menos 15 caracteres')
    .max(255, 'Máximo 255 caracteres'),
});
type CancelValues = z.infer<typeof cancelSchema>;

export function FiscalPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('aba') as Tab) ?? 'cancelar';
  const [tab, setTab] = useState<Tab>(initialTab);

  const setActiveTab = (next: Tab) => {
    setTab(next);
    setSearchParams({ aba: next });
  };

  return (
    <div className="space-y-8 reveal">
      <Breadcrumb
        items={[
          { label: 'Fiscal' },
          { label: tab === 'cancelar' ? 'Cancelar NFC-e' : 'Relatório Z' },
        ]}
      />
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn-tertiary self-start p-0"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Voltar
      </button>

      <header>
        <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2 flex items-center gap-2">
          <FileText size={14} aria-hidden="true" /> EP-01-F3 · NFC-e / SAT Homologado
        </div>
        <h1 className="heading-serif text-fluid-h1 mb-2">
          Operações <em className="text-coral-500">fiscais</em>
        </h1>
        <p className="text-ink-5 text-base max-w-2xl">
          Cancelamento de NFC-e dentro da janela legal e Relatório Z do fechamento de turno por estação.
        </p>
      </header>

      <nav role="tablist" aria-label="Operações fiscais" className="border-b border-border flex gap-2 flex-wrap">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'cancelar'}
          aria-controls="tab-cancelar"
          onClick={() => setActiveTab('cancelar')}
          className={clsx(
            'px-4 py-3 text-[12px] uppercase tracking-cta font-bold transition border-b-2',
            tab === 'cancelar'
              ? 'text-ink-7 border-coral-500'
              : 'text-ink-5 border-transparent hover:text-ink-7',
          )}
        >
          <FileX size={14} className="inline mr-1.5" aria-hidden="true" />
          Cancelar NFC-e
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'relatorio-z'}
          aria-controls="tab-relatorio-z"
          onClick={() => setActiveTab('relatorio-z')}
          className={clsx(
            'px-4 py-3 text-[12px] uppercase tracking-cta font-bold transition border-b-2',
            tab === 'relatorio-z'
              ? 'text-ink-7 border-coral-500'
              : 'text-ink-5 border-transparent hover:text-ink-7',
          )}
        >
          <FileText size={14} className="inline mr-1.5" aria-hidden="true" />
          Relatório Z · fechamento
        </button>
      </nav>

      {tab === 'cancelar' && (
        <div role="tabpanel" id="tab-cancelar">
          <CancelNfcePanel />
        </div>
      )}
      {tab === 'relatorio-z' && (
        <div role="tabpanel" id="tab-relatorio-z">
          <RelatorioZPanel />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CANCELAR NFC-e                                                      */
/* ------------------------------------------------------------------ */

function CancelNfcePanel() {
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [pendingValues, setPendingValues] = useState<CancelValues | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CancelValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { nfceKey: '', justification: '' },
    mode: 'onBlur',
  });

  const onLookup = handleSubmit(async (values) => {
    await new Promise((r) => setTimeout(r, 400));
    const key = values.nfceKey.toLowerCase();
    const found = orders.find(
      (o) =>
        o.id.toLowerCase().includes(key) ||
        (o.fiscal?.chave?.toLowerCase().includes(key) ?? false),
    ) ?? orders[0];
    setFoundOrder(found);
    setPendingValues(values);

    const minutesSince = Math.floor(
      (Date.now() - new Date(found.createdAt).getTime()) / 60_000,
    );

    if (minutesSince > 30) {
      toast.error('Fora da janela de cancelamento', {
        description: `${minutesSince} min desde emissão · use Troca/Devolução cross-channel para emitir NF de devolução.`,
      });
      return;
    }
    setManagerOpen(true);
  });

  const handleManagerApproved = () => {
    setManagerOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (foundOrder) {
      toast.success('NFC-e cancelada · evento enviado à SEFAZ', {
        description: `${foundOrder.id} · justificativa: "${pendingValues?.justification.slice(0, 40)}…"`,
      });
    }
    reset();
    setFoundOrder(null);
    setPendingValues(null);
  };

  const minutesSince = foundOrder
    ? Math.floor((Date.now() - new Date(foundOrder.createdAt).getTime()) / 60_000)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <form onSubmit={onLookup} className="card p-5 md:p-6 space-y-5" noValidate>
        <div className="field">
          <label htmlFor="nfceKey">
            Chave NFC-e ou número do pedido <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4"
            />
            <input
              id="nfceKey"
              type="text"
              placeholder="Cole a chave de 44 dígitos ou ORD-..."
              autoComplete="off"
              aria-required="true"
              aria-invalid={!!errors.nfceKey}
              aria-describedby={errors.nfceKey ? 'nfceKey-error' : 'nfceKey-help'}
              className="input pl-12 font-mono"
              {...register('nfceKey')}
            />
          </div>
          {errors.nfceKey ? (
            <p id="nfceKey-error" role="alert" className="text-[12px] text-danger mt-1">
              {errors.nfceKey.message}
            </p>
          ) : (
            <p id="nfceKey-help" className="text-[11px] text-ink-5 mt-1">
              Demo · qualquer texto traz a primeira NFC-e do mock
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="justification">
            Justificativa fiscal <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <textarea
            id="justification"
            rows={3}
            placeholder="Erro de digitação no CPF do consumidor · solicitação de cancelamento dentro da janela de 30 min"
            aria-required="true"
            aria-invalid={!!errors.justification}
            aria-describedby={errors.justification ? 'justification-error' : undefined}
            className="input"
            {...register('justification')}
          />
          {errors.justification && (
            <p id="justification-error" role="alert" className="text-[12px] text-danger mt-1">
              {errors.justification.message}
            </p>
          )}
          <p className="text-[11px] text-ink-5 mt-1">
            Texto enviado à SEFAZ · auditável em SAP GRC
          </p>
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
              Localizando NFC-e…
            </>
          ) : (
            <>
              <Lock size={14} aria-hidden="true" />
              Solicitar cancelamento
            </>
          )}
        </button>
      </form>

      <aside className="space-y-4">
        <div className="card p-5 bg-coral-50 border-coral-200">
          <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-2">
            Janela legal de cancelamento
          </div>
          <p className="text-[13px] text-ink-7 mb-3">
            <strong>30 min</strong> da emissão · após isso é necessário emitir NF de devolução via{' '}
            <a href="/troca" className="underline">Troca cross-channel</a>.
          </p>
          <ul className="text-[12px] text-ink-6 space-y-1.5 list-disc pl-4">
            <li>Aprovação obrigatória do gerente · PIN + justificativa</li>
            <li>Audit trail SAP GRC · campo obrigatório por compliance</li>
            <li>Evento de cancelamento enviado à SEFAZ &lt; 5s</li>
          </ul>
        </div>

        {foundOrder && (
          <div className="card p-5">
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-2">
              NFC-e localizada
            </div>
            <div className="font-mono text-[13px] text-ink-7 break-all">
              {foundOrder.fiscal?.chave ?? `${foundOrder.id} · chave provisória`}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
                  Total
                </div>
                <div className="font-bold text-lg">{formatBRL(foundOrder.total)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
                  Emitida há
                </div>
                <div
                  className={clsx(
                    'font-bold text-lg',
                    minutesSince !== null && minutesSince <= 30
                      ? 'text-success'
                      : 'text-danger',
                  )}
                >
                  {minutesSince ?? 0} min
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <ManagerApprovalDialog
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onApproved={handleManagerApproved}
        context={{
          fraudScore: 0.05,
          fraudLevel: 'warning',
          total: foundOrder?.total ?? 0,
          customerName: foundOrder?.customer?.name,
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        tone="danger"
        title="Confirmar cancelamento da NFC-e?"
        description="Operação irreversível · evento será enviado à SEFAZ e gravado em SAP GRC."
        body={
          <ul className="text-[12px] text-ink-6 space-y-1.5 list-disc pl-4">
            <li>NFC-e ficará marcada como CANCELADA</li>
            <li>Estoque será revertido (LI-03 inventário vivo)</li>
            <li>Cliente recebe e-mail de cancelamento</li>
            <li>Vendedor recebe registro no histórico de turno</li>
          </ul>
        }
        confirmLabel="Confirmar cancelamento"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RELATÓRIO Z                                                         */
/* ------------------------------------------------------------------ */

function RelatorioZPanel() {
  const seller = usePosStore((s) => s.seller);
  const [stationId, setStationId] = useState<string>(seller?.id ?? sellers[0]?.id ?? '');
  const [closing, setClosing] = useState(false);

  const station = sellers.find((s) => s.id === stationId) ?? sellers[0];
  const stationOrders = useMemo(
    () => orders.filter((o) => o.sellerId === stationId),
    [stationId],
  );

  const totals = useMemo(() => {
    const sum = stationOrders.reduce(
      (acc, o) => {
        acc.gross += o.total;
        const method = o.paymentMethod;
        acc.byMethod[method] = (acc.byMethod[method] ?? 0) + o.total;
        return acc;
      },
      { gross: 0, byMethod: {} as Record<string, number> },
    );
    const tax = Number((sum.gross * 0.265).toFixed(2)); // CBS 8.8 + IBS 17.7
    return {
      gross: sum.gross,
      tax,
      net: Number((sum.gross - tax).toFixed(2)),
      byMethod: sum.byMethod,
      count: stationOrders.length,
    };
  }, [stationOrders]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      toast.success('Turno encerrado · Relatório Z gerado', {
        description: `${station?.name} · ${totals.count} cupons · ${formatBRL(totals.gross)} bruto`,
      });
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <article className="receipt card p-5 md:p-6">
        <header className="border-b-2 border-ink-7 pb-3 mb-4">
          <div className="text-[11px] uppercase tracking-label font-bold text-coral-500">
            Relatório Z · fechamento de turno
          </div>
          <h2 className="font-serif text-2xl mt-1.5">
            {station?.storeName} · estação {station?.id}
          </h2>
          <div className="text-[12px] text-ink-5 mt-1 flex items-center gap-2 flex-wrap">
            <Calendar size={12} aria-hidden="true" />
            {new Date().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}{' '}
            · vendedor {station?.name}
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Cupons</div>
            <div className="font-serif text-2xl font-semibold">{totals.count}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">Bruto</div>
            <div className="font-serif text-2xl font-semibold text-coral-500">
              {formatBRL(totals.gross)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
              Tributos (CBS+IBS)
            </div>
            <div className="font-serif text-2xl font-semibold text-warning">
              − {formatBRL(totals.tax)}
            </div>
          </div>
          <div className="md:col-span-3 border-t border-border pt-3">
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
              Líquido
            </div>
            <div className="font-serif text-3xl font-semibold text-success">
              {formatBRL(totals.net)}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] uppercase tracking-cta font-bold text-ink-5 mb-3">
            Por método de pagamento
          </h3>
          <ul className="space-y-2">
            {Object.entries(totals.byMethod).map(([method, value]) => (
              <li
                key={method}
                className="flex items-center justify-between text-sm border-b border-border-light pb-2 last:border-0"
              >
                <span className="capitalize">{method}</span>
                <span className="font-bold tabular-nums">{formatBRL(value)}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="hidden print:block mt-6 pt-3 border-t-2 border-ink-7 text-center text-[10pt]">
          <p>VIVARA · Documento auxiliar · não é cupom fiscal</p>
          <p className="mt-1">SPED Fiscal mensal exportado automaticamente</p>
        </footer>
      </article>

      <aside className="space-y-4 lg:sticky lg:top-[96px] lg:self-start">
        <div className="card p-5">
          <label
            htmlFor="stationSelect"
            className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-2"
          >
            Estação / Vendedor
          </label>
          <select
            id="stationSelect"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className="input"
          >
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.storeName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="btn-secondary btn-lg w-full"
        >
          <Printer size={14} aria-hidden="true" /> Imprimir Relatório Z
        </button>

        <button
          type="button"
          onClick={handleClose}
          disabled={closing}
          aria-busy={closing}
          className="btn-primary btn-lg w-full"
        >
          {closing ? (
            <>
              <span
                aria-hidden="true"
                className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              />
              Encerrando turno…
            </>
          ) : (
            <>
              <CheckCircle2 size={14} aria-hidden="true" />
              Encerrar turno
            </>
          )}
        </button>

        <div className="card p-4 bg-warning-light border-warning/30 text-[12px] text-ink-7 flex items-start gap-2">
          <AlertTriangle
            size={14}
            aria-hidden="true"
            className="text-warning flex-shrink-0 mt-0.5"
          />
          <span>
            Após encerrado, o turno fica congelado e não aceita novas vendas até a próxima abertura
            de caixa.
          </span>
        </div>
      </aside>
    </div>
  );
}
