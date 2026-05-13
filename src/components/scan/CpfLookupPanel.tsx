import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  IdCard,
  Search,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { customers, findCustomerByCpf } from '@/data/mocks';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { maskCpfInput, unmaskCpf, validateCpf } from '@/utils/cpf';
import type { Customer } from '@/types';

/**
 * CpfLookupPanel · identificação por CPF.
 *
 * 1. Input mascarado em tempo real (`000.000.000-00`).
 * 2. Validação local de dígito verificador (sem ida ao SERPRO).
 * 3. Busca em `customers` (mock CDP) — em produção integraria ao CDP/Receita.
 * 4. Quando NÃO encontra um cliente válido, oferece cadastro inline com
 *    nome, e-mail, telefone e opt-ins. O cliente é empilhado no array `customers`
 *    em runtime (mock-only side effect) e marcado como ativo no store.
 */

type Phase = 'idle' | 'not-found' | 'creating';

interface NewCustomerForm {
  name: string;
  email: string;
  phone: string;
  optInWhatsapp: boolean;
  optInLI: boolean;
}

const initialForm: NewCustomerForm = {
  name: '',
  email: '',
  phone: '',
  optInWhatsapp: true,
  optInLI: false,
};

interface Props {
  onClose: () => void;
}

export function CpfLookupPanel({ onClose }: Props) {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const selectCustomer = usePosStore((s) => s.selectCustomer);
  const seller = usePosStore((s) => s.seller);

  const [cpf, setCpf] = useState('');
  const [touched, setTouched] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [form, setForm] = useState<NewCustomerForm>(initialForm);

  const digits = unmaskCpf(cpf);
  const isComplete = digits.length === 11;
  const isValid = isComplete && validateCpf(cpf);
  const showStructureError = touched && isComplete && !isValid;

  function reset() {
    setCpf('');
    setTouched(false);
    setPhase('idle');
    setForm(initialForm);
  }

  function handleLookup() {
    setTouched(true);
    if (!isValid) return;
    const found = findCustomerByCpf(cpf);
    if (found) {
      selectCustomer(found);
      toast.success(`${found.name} identificado por CPF`, {
        description:
          found.tier === 'diamond'
            ? 'Cliente Diamond · Agente IA dispara nudges em segundos.'
            : 'Visão 360° carregada · histórico cross-channel disponível.',
      });
      navigate(tp(`/cliente/${found.id}`));
      onClose();
      return;
    }
    setPhase('not-found');
  }

  function handleCreate() {
    const trimmedName = form.name.trim();
    if (trimmedName.length < 3) {
      toast.error('Informe o nome completo do cliente');
      return;
    }
    if (!/.+@.+\..+/.test(form.email.trim())) {
      toast.error('Informe um e-mail válido');
      return;
    }
    if (unmaskCpf(form.phone).length < 10) {
      toast.error('Informe um telefone válido (DDD + número)');
      return;
    }

    const id = `CL-${String(900 + customers.length).padStart(3, '0')}`;
    const novo: Customer = {
      id,
      name: trimmedName,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      cpf,
      tier: 'standard',
      totalLTV: 0,
      lastPurchaseISO: new Date().toISOString(),
      totalOrders: 0,
      preferences: [],
      wishlist: [],
      optInWhatsapp: form.optInWhatsapp,
      optInLI: form.optInLI,
      city: seller?.storeName?.replace(/^Vivara\s|^Life\s/i, '') ?? '—',
    };

    // mock-only side effect · sem persistência
    customers.push(novo);
    selectCustomer(novo);
    toast.success(`Novo cliente cadastrado · ${novo.name}`, {
      description: 'Opt-ins registrados conforme LGPD · Visão 360° abrindo…',
    });
    navigate(tp(`/cliente/${novo.id}`));
    onClose();
  }

  return (
    <section
      aria-label="Identificação por CPF"
      className="border border-coral-200 bg-coral-50/40 p-4 md:p-5 space-y-4"
    >
      <header>
        <div className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1 inline-flex items-center gap-1.5">
          <IdCard size={12} aria-hidden="true" />
          Identificação por CPF
        </div>
        <h3 className="font-serif text-lg md:text-xl text-ink-7">
          Digite ou conecte o leitor RPA · validamos os dígitos no instante
        </h3>
      </header>

      <div className="field">
        <label htmlFor="cpf-input">CPF do cliente</label>
        <div className="relative">
          <IdCard
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
          />
          <input
            id="cpf-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={cpf}
            onChange={(e) => {
              setCpf(maskCpfInput(e.target.value));
              if (phase === 'not-found') setPhase('idle');
            }}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleLookup();
              }
            }}
            placeholder="000.000.000-00"
            maxLength={14}
            className={clsx('input pl-9 tabular-nums', showStructureError && 'input-error')}
            aria-invalid={showStructureError || undefined}
            aria-describedby={showStructureError ? 'cpf-input-err' : undefined}
            disabled={phase === 'creating'}
          />
        </div>
        {showStructureError && (
          <span id="cpf-input-err" className="err">
            Dígito verificador inválido · confirme o CPF digitado.
          </span>
        )}
      </div>

      {phase !== 'creating' && (
        <button
          type="button"
          onClick={handleLookup}
          disabled={!isComplete}
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
          aria-label="Identificar cliente pelo CPF"
        >
          <Search size={14} aria-hidden="true" />
          Identificar
        </button>
      )}

      {phase === 'not-found' && (
        <div className="border border-warning bg-warning/10 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-[12px] text-ink-7 leading-snug">
              <strong>CPF não encontrado</strong> na base CDP · você pode
              cadastrar o cliente agora para vincular esta venda à Visão 360°.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPhase('creating')}
            className="btn-secondary btn-sm w-full inline-flex items-center justify-center gap-2"
          >
            <UserPlus size={14} aria-hidden="true" />
            Cadastrar novo cliente
          </button>
        </div>
      )}

      {phase === 'creating' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
          className="space-y-3 border-t border-coral-200 pt-3"
          aria-label="Cadastro rápido de cliente"
        >
          <div className="text-[10px] uppercase tracking-cta font-bold text-coral-500 inline-flex items-center gap-1.5">
            <UserPlus size={12} aria-hidden="true" />
            Novo cliente · LGPD por opt-in
          </div>

          <div className="field">
            <label htmlFor="new-cust-name">Nome completo</label>
            <input
              id="new-cust-name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex.: Carolina Mendes"
              className="input"
              required
              minLength={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label htmlFor="new-cust-email">E-mail</label>
              <input
                id="new-cust-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="cliente@email.com"
                className="input"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="new-cust-phone">Telefone</label>
              <input
                id="new-cust-phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+55 11 91234-5678"
                className="input"
                required
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-[10px] uppercase tracking-cta font-bold text-ink-5 mb-1">
              Consentimentos (LGPD)
            </legend>
            <label className="flex items-start gap-2 text-[12px] text-ink-7 cursor-pointer">
              <input
                type="checkbox"
                checked={form.optInWhatsapp}
                onChange={(e) => setForm((f) => ({ ...f, optInWhatsapp: e.target.checked }))}
                className="mt-0.5"
              />
              <span>
                <strong>WhatsApp 1:1</strong> · cuidados da peça, NFC-e e ofertas exclusivas.
              </span>
            </label>
            <label className="flex items-start gap-2 text-[12px] text-ink-7 cursor-pointer">
              <input
                type="checkbox"
                checked={form.optInLI}
                onChange={(e) => setForm((f) => ({ ...f, optInLI: e.target.checked }))}
                className="mt-0.5"
              />
              <span>
                <strong>Living Intelligence + biometria</strong> · personalização e
                reconhecimento facial em loja.
              </span>
            </label>
          </fieldset>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="btn-tertiary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
              <CheckCircle2 size={14} aria-hidden="true" />
              Cadastrar e abrir 360°
            </button>
          </div>
        </form>
      )}

      <footer className="flex items-start gap-2 text-[10px] uppercase tracking-cta text-ink-5 border-t border-coral-200 pt-3">
        <ShieldCheck size={11} className="text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span className="leading-snug normal-case tracking-normal text-ink-6">
          <strong className="text-ink-7 uppercase tracking-cta">LGPD-by-design:</strong>{' '}
          validação de dígito verificador local · CPF mascarado em tela · integração SERPRO
          continua sendo a fonte de verdade em produção.
        </span>
      </footer>
    </section>
  );
}
