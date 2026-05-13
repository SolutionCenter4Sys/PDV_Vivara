import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { QrCode, ScanLine, IdCard, Search, User, ScanFace } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from './Modal';
import { customers } from '@/data/mocks';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { maskCpf } from '@/utils/format';
import { FacialRecognitionPanel } from './scan/FacialRecognitionPanel';
import { CpfLookupPanel } from './scan/CpfLookupPanel';

/**
 * EP-03-F1 · Visão 360 · Identificação de cliente.
 *
 * Três caminhos curados (mobile-first), todos abrindo a Visão 360°:
 *   - QR Code · scan rápido por link enviado em WhatsApp/e-mail
 *   - Reconhecimento facial · embeddings on-device (LGPD opt-in)
 *   - Leitor CPF · validação local + cadastro inline se não encontrado
 *
 * O form livre (CPF/email/nome) continua disponível como fallback abaixo dos
 * painéis especializados, e a lista "Recentes do turno" facilita reabrir um
 * atendimento que estava em andamento.
 */

const schema = z.object({
  query: z.string().min(3, 'Digite ao menos 3 caracteres (CPF, e-mail ou nome)'),
});
type FormValues = z.infer<typeof schema>;

export type ScanInitialPanel = 'facial' | 'cpf' | 'search' | null;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Painel já expandido ao abrir o dialog. */
  initialPanel?: ScanInitialPanel;
}

type Panel = 'facial' | 'cpf' | null;

export function CustomerQuickScanDialog({ open, onClose, initialPanel = null }: Props) {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const selectCustomer = usePosStore((s) => s.selectCustomer);
  const [scanning, setScanning] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { query: '' },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) {
      reset();
      setScanning(false);
      setPanel(null);
      return;
    }
    if (initialPanel === 'facial' || initialPanel === 'cpf') {
      setPanel(initialPanel);
    } else {
      setPanel(null);
    }
  }, [open, initialPanel, reset]);

  const onSubmit = handleSubmit((values) => {
    const q = values.query.trim().toLowerCase();
    const cleanCpf = q.replace(/\D/g, '');
    const found = customers.find(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (cleanCpf.length > 0 && c.cpf.replace(/\D/g, '').includes(cleanCpf)),
    );

    if (!found) {
      toast.error('Cliente não encontrado', {
        description: 'Tente reconhecimento facial ou cadastre via "Leitor CPF".',
      });
      return;
    }
    selectCustomer(found);
    navigate(tp(`/cliente/${found.id}`));
    onClose();
    toast.success(`${found.name} identificado`, {
      description:
        found.tier === 'diamond'
          ? 'Cliente Diamond · Agente IA dispara nudges de combinação e antecipatório.'
          : 'Visão 360 carregada · histórico cross-channel disponível.',
    });
  });

  const simulateQrScan = () => {
    setScanning(true);
    setTimeout(() => {
      const target = customers[0];
      if (!target) return;
      selectCustomer(target);
      setScanning(false);
      navigate(tp(`/cliente/${target.id}`));
      onClose();
      toast.success(`QR Code reconhecido · ${target.name}`, {
        description: 'Beacon Bluetooth + opt-in WhatsApp validado · LI-01 ativada.',
      });
    }, 1400);
  };

  const cards: Array<{
    id: 'qr' | 'facial' | 'cpf';
    icon: typeof QrCode;
    title: string;
    description: string;
    onClick: () => void;
    isActive: boolean;
    disabled?: boolean;
  }> = [
    {
      id: 'qr',
      icon: QrCode,
      title: scanning ? 'Escaneando…' : 'QR Code',
      description: 'Use a câmera para ler o QR enviado por WhatsApp ou e-mail.',
      onClick: simulateQrScan,
      isActive: false,
      disabled: scanning,
    },
    {
      id: 'facial',
      icon: ScanFace,
      title: 'Reconhecimento facial',
      description: 'Embeddings on-device · só clientes com opt-in biométrico.',
      onClick: () => setPanel((p) => (p === 'facial' ? null : 'facial')),
      isActive: panel === 'facial',
    },
    {
      id: 'cpf',
      icon: IdCard,
      title: 'Leitor CPF',
      description: 'Digite ou conecte o leitor RPA · validamos os dígitos no instante.',
      onClick: () => setPanel((p) => (p === 'cpf' ? null : 'cpf')),
      isActive: panel === 'cpf',
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Identificar cliente"
      description="QR Code, reconhecimento facial ou CPF · LGPD garantido por opt-in"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                type="button"
                onClick={c.onClick}
                disabled={c.disabled}
                aria-pressed={c.isActive}
                aria-expanded={c.isActive}
                aria-controls={c.id !== 'qr' ? `scan-panel-${c.id}` : undefined}
                aria-label={`Identificar via ${c.title}`}
                className={clsx(
                  'border px-4 py-4 text-left flex flex-col gap-2 transition group min-h-[120px]',
                  c.isActive
                    ? 'border-coral-500 bg-coral-50 shadow-sm'
                    : 'border-ink-7 hover:bg-ink-7 hover:text-white',
                  c.disabled && 'opacity-60 cursor-progress',
                )}
              >
                <span
                  className={clsx(
                    'flex items-center gap-2 text-[11px] uppercase tracking-cta font-bold',
                    c.isActive ? 'text-coral-500' : 'text-coral-500 group-hover:text-coral-200',
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  {c.title}
                </span>
                <span
                  className={clsx(
                    'text-[12px] leading-snug',
                    c.isActive ? 'text-ink-7' : 'text-ink-7 group-hover:text-white/90',
                  )}
                >
                  {c.description}
                </span>
              </button>
            );
          })}
        </div>

        {panel === 'facial' && (
          <div id="scan-panel-facial" role="region" aria-label="Painel de reconhecimento facial">
            <FacialRecognitionPanel onClose={onClose} />
          </div>
        )}

        {panel === 'cpf' && (
          <div id="scan-panel-cpf" role="region" aria-label="Painel de identificação por CPF">
            <CpfLookupPanel onClose={onClose} />
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3 border-t border-border-light pt-4" noValidate>
          <div className="text-[10px] uppercase tracking-cta font-bold text-ink-5">
            Busca livre · fallback
          </div>
          <div className="field">
            <label htmlFor="customer-query" className="sr-only">
              CPF, e-mail ou nome
            </label>
            <div className="relative">
              <Search
                size={16}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
              />
              <input
                id="customer-query"
                type="text"
                autoComplete="off"
                placeholder="ex.: Mariana, mariana@email.com ou parte do CPF"
                className={clsx('input pl-9', errors.query && 'input-error')}
                aria-invalid={!!errors.query}
                aria-describedby={errors.query ? 'customer-query-err' : undefined}
                {...register('query')}
              />
            </div>
            {errors.query && (
              <span id="customer-query-err" className="err">
                {errors.query.message}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-secondary btn-sm w-full"
            aria-label="Buscar cliente pela consulta digitada"
          >
            <Search size={14} aria-hidden="true" />
            Buscar
          </button>
        </form>

        <div className="border-t border-border pt-4">
          <div className="text-[11px] uppercase tracking-cta font-bold text-ink-5 mb-2">
            Recentes do turno
          </div>
          <div className="space-y-2">
            {customers.slice(0, 3).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  selectCustomer(c);
                  navigate(tp(`/cliente/${c.id}`));
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 border border-border hover:bg-coral-50 transition text-left"
              >
                <div className="w-9 h-9 rounded-full bg-coral-500 text-white flex items-center justify-center font-serif text-sm">
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-ink-7 truncate flex items-center gap-2">
                    {c.name}
                    {c.tier === 'diamond' && (
                      <span className="tag bg-ink-7 text-white text-[9px]">Diamond</span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-5">
                    {maskCpf(c.cpf)} · {c.city}
                  </div>
                </div>
                <User size={14} aria-hidden="true" className="text-ink-4 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-ink-4 uppercase tracking-cta border-t border-border-light pt-3 flex items-center gap-2">
          <ScanLine size={12} aria-hidden="true" className="text-coral-500" />
          LGPD by-design · CPF mascarado · histórico cross-channel via CDP
        </div>
      </div>
    </Modal>
  );
}
