import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Scale,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * EP-01-F4 · Reforma Tributária 2026 (CBS/IBS)
 * F4-FE-01 · Painel admin tributário · visualizar e editar alíquotas
 *
 * Apenas perfil "Fiscal" (mock) edita. Vendedor visualiza.
 *
 * Períodos:
 * - Vigente: ICMS + ISS + PIS/COFINS
 * - Transição: 01/01/2026–31/12/2026 → CBS (federal) ativa em paralelo
 * - Pleno: ≥ 01/01/2027 → CBS + IBS (estado+município) substituem
 */

interface TaxRule {
  id: string;
  ncm: string;
  description: string;
  uf: string;
  city: string;
  cbs: number; // federal
  ibs: number; // estadual + municipal
  legacy: { icms: number; iss: number; pis: number; cofins: number };
  effectiveFrom: string; // ISO
  status: 'ativa' | 'transicao' | 'rascunho';
}

const MOCK_RULES: TaxRule[] = [
  {
    id: 'TR-001',
    ncm: '7113.19.00',
    description: 'Joias de ouro 18k · alianças e anéis',
    uf: 'SP',
    city: 'São Paulo',
    cbs: 8.8,
    ibs: 17.7,
    legacy: { icms: 18, iss: 0, pis: 1.65, cofins: 7.6 },
    effectiveFrom: '2026-01-01',
    status: 'transicao',
  },
  {
    id: 'TR-002',
    ncm: '7113.20.00',
    description: 'Joias de ouro com pedras preciosas',
    uf: 'SP',
    city: 'São Paulo',
    cbs: 8.8,
    ibs: 17.7,
    legacy: { icms: 18, iss: 0, pis: 1.65, cofins: 7.6 },
    effectiveFrom: '2026-01-01',
    status: 'transicao',
  },
  {
    id: 'TR-003',
    ncm: '7113.19.00',
    description: 'Joias de ouro 18k · alianças e anéis',
    uf: 'RJ',
    city: 'Rio de Janeiro',
    cbs: 8.8,
    ibs: 18.5,
    legacy: { icms: 20, iss: 0, pis: 1.65, cofins: 7.6 },
    effectiveFrom: '2026-01-01',
    status: 'transicao',
  },
  {
    id: 'TR-004',
    ncm: '7117.19.00',
    description: 'Bijuterias prata · linha Life',
    uf: 'SP',
    city: 'São Paulo',
    cbs: 7.5,
    ibs: 16.5,
    legacy: { icms: 18, iss: 0, pis: 1.65, cofins: 7.6 },
    effectiveFrom: '2026-01-01',
    status: 'transicao',
  },
  {
    id: 'TR-005',
    ncm: '9101.21.00',
    description: 'Relógios de pulso · automáticos',
    uf: 'SP',
    city: 'São Paulo',
    cbs: 8.8,
    ibs: 17.7,
    legacy: { icms: 18, iss: 0, pis: 1.65, cofins: 7.6 },
    effectiveFrom: '2026-07-01',
    status: 'rascunho',
  },
  {
    id: 'TR-006',
    ncm: '7113.19.00',
    description: 'Joias de ouro 18k · alianças (pleno 2027)',
    uf: 'SP',
    city: 'São Paulo',
    cbs: 8.8,
    ibs: 17.7,
    legacy: { icms: 0, iss: 0, pis: 0, cofins: 0 },
    effectiveFrom: '2027-01-01',
    status: 'rascunho',
  },
];

const STATUS_LABEL: Record<TaxRule['status'], string> = {
  ativa: 'Ativa',
  transicao: 'Transição CBS+ICMS dual',
  rascunho: 'Rascunho · futura',
};

const STATUS_COLOR: Record<TaxRule['status'], string> = {
  ativa: 'bg-success/15 text-success',
  transicao: 'bg-warning-light text-warning',
  rascunho: 'bg-ink-2 text-ink-7',
};

const editSchema = z.object({
  cbs: z
    .number({ error: 'Valor numérico obrigatório' })
    .min(0, 'CBS não pode ser negativo')
    .max(20, 'CBS acima do teto BACEN'),
  ibs: z
    .number({ error: 'Valor numérico obrigatório' })
    .min(0, 'IBS não pode ser negativo')
    .max(30, 'IBS acima do teto'),
  effectiveFrom: z.string().min(1, 'Defina vigência'),
});
type EditValues = z.infer<typeof editSchema>;

export function TaxAdminPage() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<TaxRule[]>(MOCK_RULES);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<TaxRule | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return rules;
    return rules.filter(
      (r) =>
        r.ncm.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.uf.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q),
    );
  }, [rules, filter]);

  const summary = useMemo(
    () => ({
      total: rules.length,
      ativa: rules.filter((r) => r.status === 'ativa').length,
      transicao: rules.filter((r) => r.status === 'transicao').length,
      rascunho: rules.filter((r) => r.status === 'rascunho').length,
      ufs: new Set(rules.map((r) => r.uf)).size,
    }),
    [rules],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    mode: 'onBlur',
  });

  const openEdit = (rule: TaxRule) => {
    setEditing(rule);
    reset({
      cbs: rule.cbs,
      ibs: rule.ibs,
      effectiveFrom: rule.effectiveFrom,
    });
  };

  const onSave = handleSubmit(async (values) => {
    if (!editing) return;
    await new Promise((r) => setTimeout(r, 400));
    setRules((prev) =>
      prev.map((r) =>
        r.id === editing.id
          ? { ...r, cbs: values.cbs, ibs: values.ibs, effectiveFrom: values.effectiveFrom }
          : r,
      ),
    );
    toast.success('Alíquota atualizada · audit trail SAP GRC', {
      description: `${editing.ncm} · ${editing.uf}/${editing.city} · CBS ${values.cbs}% / IBS ${values.ibs}%`,
    });
    setEditing(null);
  });

  const runAudit = () => {
    setAuditOpen(false);
    toast.success('Auditoria automatizada concluída', {
      description: '6 regras checadas vs LC 214/2025 · 0 desvios encontrados · log gravado em SAP GRC.',
    });
  };

  return (
    <div className="space-y-8 reveal">
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Tributos · CBS/IBS' }]} />
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn-tertiary self-start p-0"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Voltar
      </button>

      <header>
        <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2 flex items-center gap-2">
          <Scale size={14} aria-hidden="true" /> EP-01-F4 · Reforma Tributária 2026
        </div>
        <h1 className="heading-serif text-fluid-h1 mb-2">
          Alíquotas <em className="text-coral-500">CBS / IBS</em>
        </h1>
        <p className="text-ink-5 text-base max-w-3xl">
          Configurador tributário transitório (CBS+ICMS dual em 2026 → CBS+IBS pleno em 2027). Auditoria automática contra a LC 214/2025 · audit trail SAP GRC obrigatório por regra editada.
        </p>
      </header>

      {/* KPIs tributários */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 border border-border">
        {[
          { label: 'Regras totais', value: summary.total, highlight: 'ink' },
          { label: 'Ativas', value: summary.ativa, highlight: 'success' },
          { label: 'Em transição', value: summary.transicao, highlight: 'coral' },
          { label: 'Rascunho 2027', value: summary.rascunho, highlight: 'ink' },
          { label: 'UFs cobertas', value: summary.ufs, highlight: 'gold' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-4 md:p-5 border-r border-b border-border last:border-r-0"
          >
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-2">
              {kpi.label}
            </div>
            <div
              className={clsx(
                'font-serif text-2xl lg:text-3xl font-semibold leading-tight',
                kpi.highlight === 'coral' && 'text-coral-500',
                kpi.highlight === 'success' && 'text-success',
                kpi.highlight === 'gold' && 'text-gold',
                kpi.highlight === 'ink' && 'text-ink-7',
              )}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </section>

      {/* LI auditoria */}
      <section className="bg-coral-50 border border-coral-200 p-5 md:p-6">
        <div className="flex items-start gap-3 flex-wrap">
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-full bg-coral-500 text-white flex items-center justify-center flex-shrink-0"
          >
            <Sparkles size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-1">
              Living Intelligence · Auditoria automatizada
            </div>
            <h2 className="font-serif text-xl mb-1.5">
              Compliance LC 214/2025 · monitoramento contínuo
            </h2>
            <p className="text-[13px] text-ink-6 mb-3">
              Modelo monitora 24/7 mudanças na LC 214/2025 + atos COTEPE/CONFAZ. Última checagem:
              hoje · sem desvios.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAuditOpen(true)}
                className="btn-primary btn-sm"
              >
                Rodar auditoria agora
              </button>
              <button
                type="button"
                onClick={() =>
                  toast.info('Exportação SPED Fiscal · Fase 2', {
                    description: 'Geração mensal automática integrada com SAP S/4HANA TaxWeb.',
                  })
                }
                className="btn-secondary btn-sm"
              >
                Exportar SPED
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filtro + tabela */}
      <section className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4"
            />
            <input
              type="text"
              placeholder="Filtrar por NCM, descrição, UF ou cidade…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input pl-12"
              aria-label="Filtrar regras tributárias"
            />
          </div>
          <span className="text-[11px] uppercase tracking-cta font-bold text-ink-5">
            {filtered.length} regra{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white pointer-events-none lg:hidden"
          />
          <div className="overflow-x-auto card">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="bg-ink-1">
                  <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">
                    NCM
                  </th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">
                    Descrição
                  </th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">
                    UF / Cidade
                  </th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">
                    CBS
                  </th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">
                    IBS
                  </th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">
                    Legado (ICMS)
                  </th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">
                    Vigência
                  </th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">
                    Status
                  </th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border-light hover:bg-coral-50 transition"
                  >
                    <td className="p-3 font-mono text-[12px]">{r.ncm}</td>
                    <td className="p-3 max-w-[260px]">{r.description}</td>
                    <td className="p-3">
                      <strong>{r.uf}</strong>
                      <div className="text-[11px] text-ink-5">{r.city}</div>
                    </td>
                    <td className="p-3 text-right font-bold tabular-nums">{r.cbs.toFixed(2)}%</td>
                    <td className="p-3 text-right font-bold tabular-nums">{r.ibs.toFixed(2)}%</td>
                    <td className="p-3 text-right text-ink-5 tabular-nums">
                      {r.legacy.icms.toFixed(2)}%
                    </td>
                    <td className="p-3 text-[12px]">
                      <CalendarClock
                        size={11}
                        aria-hidden="true"
                        className="inline mr-1 text-ink-5"
                      />
                      {new Date(r.effectiveFrom).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <span className={clsx('tag', STATUS_COLOR[r.status])}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="text-[11px] uppercase tracking-cta font-bold text-coral-500 hover:text-coral-dark-02 min-h-[36px] px-2"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Editar ${editing.ncm}` : 'Editar regra'}
        description={editing ? `${editing.description} · ${editing.uf}/${editing.city}` : undefined}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              disabled={isSubmitting}
              className="btn-tertiary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="tax-edit-form"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Salvando…' : 'Salvar e auditar'}
            </button>
          </>
        }
      >
        {editing && (
          <form id="tax-edit-form" onSubmit={onSave} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label htmlFor="cbs">
                  CBS · federal (%) <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="cbs"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  aria-required="true"
                  aria-invalid={!!errors.cbs}
                  className="input"
                  {...register('cbs', { valueAsNumber: true })}
                />
                {errors.cbs && (
                  <p role="alert" className="text-[12px] text-danger mt-1">
                    {errors.cbs.message}
                  </p>
                )}
              </div>
              <div className="field">
                <label htmlFor="ibs">
                  IBS · estadual+municipal (%){' '}
                  <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="ibs"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  aria-required="true"
                  aria-invalid={!!errors.ibs}
                  className="input"
                  {...register('ibs', { valueAsNumber: true })}
                />
                {errors.ibs && (
                  <p role="alert" className="text-[12px] text-danger mt-1">
                    {errors.ibs.message}
                  </p>
                )}
              </div>
            </div>
            <div className="field">
              <label htmlFor="effectiveFrom">
                Vigência a partir de <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="effectiveFrom"
                type="date"
                aria-required="true"
                aria-invalid={!!errors.effectiveFrom}
                className="input"
                {...register('effectiveFrom')}
              />
              {errors.effectiveFrom && (
                <p role="alert" className="text-[12px] text-danger mt-1">
                  {errors.effectiveFrom.message}
                </p>
              )}
              <p className="text-[11px] text-ink-5 mt-1">
                Antes de 2027 · CBS+ICMS dual · após 2027 · CBS+IBS pleno
              </p>
            </div>
            <div className="bg-ink-1 border border-border p-3 text-[12px] text-ink-6 flex items-start gap-2">
              <AlertTriangle
                size={14}
                aria-hidden="true"
                className="text-warning flex-shrink-0 mt-0.5"
              />
              <span>
                Toda alteração gera evento em SAP GRC e dispara auditoria contra LC 214/2025. Não é
                possível desativar audit trail.
              </span>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        onConfirm={runAudit}
        tone="info"
        title="Rodar auditoria automatizada agora?"
        description="Compara as 6 regras vigentes contra a LC 214/2025 + atos COTEPE atualizados."
        confirmLabel={
          <>
            <CheckCircle2 size={14} aria-hidden="true" /> Rodar auditoria
          </>
        }
      />
    </div>
  );
}
