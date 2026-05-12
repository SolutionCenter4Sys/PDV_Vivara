import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldAlert, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { Modal } from './Modal';

/**
 * EP-04-F5 · Anti-fraude PDV-nativo · F5-FE-02 Escalonamento ao gerente
 * EP-05-F7 · Pricing Dinâmico (Fase 3) · aprovação de descontos > 5%
 *
 * Modal de aprovação por PIN do gerente · padrão Eliza/Fourblox:
 * - RHF + Zod
 * - Estados de submit (idle | loading | error)
 * - aria-describedby + aria-invalid
 * - PIN aceito no mock: 9999 (apenas demo)
 */

const schema = z.object({
  managerPin: z
    .string()
    .min(4, 'PIN do gerente deve ter 4 dígitos')
    .max(6, 'PIN do gerente deve ter no máximo 6 dígitos')
    .regex(/^\d+$/, 'Use somente números'),
  reason: z.string().min(10, 'Justificativa precisa ter pelo menos 10 caracteres'),
});

type FormValues = z.infer<typeof schema>;

interface Context {
  fraudScore: number;
  fraudLevel: 'safe' | 'warning' | 'block';
  total: number;
  customerName?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
  context: Context;
}

const MOCK_MANAGER_PIN = '9999';

export function ManagerApprovalDialog({ open, onClose, onApproved, context }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { managerPin: '', reason: '' },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    if (values.managerPin !== MOCK_MANAGER_PIN) {
      toast.error('PIN do gerente inválido', {
        description: 'Para o demo · use 9999. Em produção · validação SAP IAM com biometria.',
      });
      return;
    }
    reset();
    onApproved();
  });

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const isBlock = context.fraudLevel === 'block';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Aprovação do gerente"
      description="Sinal de risco anti-fraude detectado · LI-04 exige liberação manual antes da TEF."
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="btn-tertiary"
          >
            Cancelar venda
          </button>
          <button
            type="submit"
            form="manager-approval-form"
            disabled={submitting}
            aria-busy={submitting}
            className={clsx(
              isBlock
                ? 'inline-flex items-center justify-center gap-2 px-5 py-3 text-[11px] uppercase tracking-cta font-bold bg-danger text-white hover:bg-danger-light transition min-h-[44px]'
                : 'btn-primary',
            )}
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                />
                Validando…
              </>
            ) : (
              <>
                <Lock size={14} aria-hidden="true" />
                {isBlock ? 'Forçar liberação' : 'Aprovar'}
              </>
            )}
          </button>
        </>
      }
    >
      <div
        className={clsx(
          'p-4 mb-5 border',
          isBlock
            ? 'bg-danger/5 border-danger/30 text-danger'
            : 'bg-warning-light border-warning/40 text-warning',
        )}
      >
        <div className="flex items-start gap-3">
          {isBlock ? (
            <ShieldAlert size={20} aria-hidden="true" className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={20} aria-hidden="true" className="flex-shrink-0 mt-0.5" />
          )}
          <div className="text-sm flex-1">
            <strong className="block uppercase tracking-cta text-[11px] mb-1.5">
              {isBlock ? 'Bloqueado · escalado' : 'Borderline · revisão'}
            </strong>
            <ul className="space-y-0.5 text-[13px] text-ink-7">
              <li>· Score LI-04: <strong>{context.fraudScore.toFixed(2)}</strong> (limiar 0,18 / bloqueio 0,30)</li>
              <li>· Valor: <strong>{context.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></li>
              <li>· Cliente: <strong>{context.customerName ?? 'Não identificado'}</strong></li>
            </ul>
          </div>
        </div>
      </div>

      <form id="manager-approval-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="field">
          <label htmlFor="managerPin">
            PIN do gerente <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            id="managerPin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            placeholder="••••"
            aria-required="true"
            aria-invalid={!!errors.managerPin}
            aria-describedby={errors.managerPin ? 'managerPin-error' : 'managerPin-help'}
            className="input tracking-[0.5em] text-center font-mono"
            {...register('managerPin')}
          />
          {errors.managerPin ? (
            <p id="managerPin-error" role="alert" className="text-[12px] text-danger mt-1">
              {errors.managerPin.message}
            </p>
          ) : (
            <p id="managerPin-help" className="text-[11px] text-ink-5 mt-1">
              Demo · use 9999 · em produção: SAP IAM com biometria
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="reason">
            Justificativa da liberação <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            placeholder="Cliente conhecido pela loja · primeiro cartão sem histórico no Vivara"
            aria-required="true"
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? 'reason-error' : undefined}
            className="input"
            {...register('reason')}
          />
          {errors.reason && (
            <p id="reason-error" role="alert" className="text-[12px] text-danger mt-1">
              {errors.reason.message}
            </p>
          )}
          <p className="text-[11px] text-ink-5 mt-1">
            Audit trail SAP GRC · campo obrigatório para BACEN/PCI-DSS
          </p>
        </div>
      </form>
    </Modal>
  );
}
