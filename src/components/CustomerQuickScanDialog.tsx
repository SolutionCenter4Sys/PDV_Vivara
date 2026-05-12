import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { QrCode, ScanLine, IdCard, Search, User } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from './Modal';
import { customers } from '@/data/mocks';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { maskCpf } from '@/utils/format';

/**
 * EP-03-F1 · Visão 360 · Scan QR Cliente
 *
 * F1-FE-01 · scan rápido por QR (e-mail link) ou CPF.
 * Vendedor identifica cliente em <5s e abre o perfil 360.
 */

const schema = z.object({
  query: z.string().min(3, 'Digite ao menos 3 caracteres (CPF, e-mail ou nome)'),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CustomerQuickScanDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const selectCustomer = usePosStore((s) => s.selectCustomer);
  const [scanning, setScanning] = useState(false);

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
    }
  }, [open, reset]);

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
        description: 'Cadastre via "Novo cliente" no menu · LGPD obrigatório.',
      });
      return;
    }
    selectCustomer(found);
    navigate(tp(`/cliente/${found.id}`));
    onClose();
    toast.success(`${found.name} identificado`, {
      description:
        found.tier === 'diamond'
          ? 'Cliente Diamond · LI-01 dispara nudges de combinação e antecipatório.'
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Identificar cliente"
      description="QR Code, CPF ou busca · LGPD garantido por opt-in"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={simulateQrScan}
            disabled={scanning}
            className={clsx(
              'border border-ink-7 px-4 py-5 text-left flex flex-col gap-2 hover:bg-ink-7 hover:text-white transition group',
              scanning && 'opacity-60',
            )}
            aria-label="Escanear QR Code do cliente"
          >
            <span className="flex items-center gap-2 text-[11px] uppercase tracking-cta font-bold text-coral-500 group-hover:text-coral-200">
              <QrCode size={14} aria-hidden="true" />
              {scanning ? 'Escaneando…' : 'QR Code'}
            </span>
            <span className="text-[13px] leading-snug">
              Use a câmera para ler o QR enviado por WhatsApp ou e-mail.
            </span>
          </button>
          <div className="border border-border px-4 py-5 flex flex-col gap-2">
            <span className="flex items-center gap-2 text-[11px] uppercase tracking-cta font-bold text-coral-500">
              <IdCard size={14} aria-hidden="true" />
              Leitor CPF
            </span>
            <span className="text-[13px] leading-snug text-ink-5">
              Conecte o leitor SERPRO RPA · captura ID + score risco em ms.
            </span>
            <span className="text-[10px] text-ink-4 uppercase tracking-cta">
              · futuro · disponível pós-MVP ·
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <div className="field">
            <label htmlFor="customer-query">CPF, e-mail ou nome</label>
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
                placeholder="ex.: 123.456.789-00 ou Mariana"
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
            className="btn-primary w-full"
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
