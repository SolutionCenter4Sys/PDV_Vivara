import { useEffect, useState } from 'react';
import { CreditCard, Loader2, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from './Modal';
import { formatBRL } from '@/utils/format';

/**
 * EP-01-F5-FE-02 · Aguardando aprovação TEF (timeout 30s).
 *
 * Mock do fluxo Stone/Cielo/Rede:
 *   - "connecting" 1.5s
 *   - "communicating" → "waiting_pin" (vendedor entrega máquina)
 *   - polling do PSP até retornar approved/declined
 *   - timeout 30s força fallback (try-other-acquirer pattern)
 */

interface Props {
  open: boolean;
  onClose: () => void;
  amount: number;
  installments: number;
  onApproved: () => void;
}

type Phase = 'connecting' | 'waiting_pin' | 'authorizing' | 'approved' | 'timeout' | 'declined';

const PHASE_LABEL: Record<Phase, string> = {
  connecting: 'Conectando ao adquirente...',
  waiting_pin: 'Aguardando senha do cliente na maquininha',
  authorizing: 'Autorizando transação no emissor',
  approved: 'Aprovado pelo emissor',
  timeout: 'Sem resposta do adquirente',
  declined: 'Transação negada',
};

const TIMEOUT_MS = 30_000;

export function TefProgressDialog({ open, onClose, amount, installments, onApproved }: Props) {
  const [phase, setPhase] = useState<Phase>('connecting');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) {
      setPhase('connecting');
      setElapsed(0);
      return;
    }

    const timers: number[] = [];

    timers.push(window.setTimeout(() => setPhase('waiting_pin'), 1600));
    timers.push(window.setTimeout(() => setPhase('authorizing'), 5200));
    timers.push(
      window.setTimeout(
        () => {
          // 92% aprovação, 5% decline, 3% timeout · realista para joalheria
          const r = Math.random();
          if (r > 0.95) setPhase('declined');
          else if (r > 0.92) setPhase('timeout');
          else setPhase('approved');
        },
        7800 + Math.random() * 3000,
      ),
    );

    const tick = window.setInterval(() => {
      setElapsed((t) => {
        const next = t + 250;
        if (next >= TIMEOUT_MS) {
          setPhase((p) => (p === 'approved' || p === 'declined' ? p : 'timeout'));
          window.clearInterval(tick);
        }
        return next;
      });
    }, 250);
    timers.push(tick);

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [open]);

  useEffect(() => {
    if (phase === 'approved') {
      toast.success('TEF aprovado', { description: `${formatBRL(amount)} · ${installments}x` });
      const t = setTimeout(() => onApproved(), 1000);
      return () => clearTimeout(t);
    }
    if (phase === 'declined') {
      toast.error('Transação negada pelo emissor', {
        description: 'Sugira outro cartão ou outra forma de pagamento.',
      });
    }
    if (phase === 'timeout') {
      toast.warning('Adquirente sem resposta · 30s', {
        description: 'Tente outra adquirente ou recomece a transação.',
      });
    }
  }, [phase, amount, installments, onApproved]);

  const progress = Math.min(100, (elapsed / TIMEOUT_MS) * 100);
  const seconds = Math.max(0, Math.floor((TIMEOUT_MS - elapsed) / 1000));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Pagamento TEF"
      description={`${formatBRL(amount)} · ${installments}x · adquirente Stone`}
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4">
          {(phase === 'connecting' ||
            phase === 'waiting_pin' ||
            phase === 'authorizing') && (
            <Loader2
              size={56}
              aria-hidden="true"
              className="animate-spin text-coral-500"
            />
          )}
          {phase === 'approved' && (
            <CheckCircle2 size={56} aria-hidden="true" className="text-success" />
          )}
          {phase === 'declined' && (
            <AlertTriangle size={56} aria-hidden="true" className="text-danger" />
          )}
          {phase === 'timeout' && (
            <AlertTriangle size={56} aria-hidden="true" className="text-warning" />
          )}

          <div className="text-center">
            <div className="text-[11px] uppercase tracking-cta font-bold text-ink-5 mb-1">
              <CreditCard size={12} className="inline mr-1" aria-hidden="true" />
              Status
            </div>
            <div className="font-serif text-xl">{PHASE_LABEL[phase]}</div>
          </div>
        </div>

        {phase !== 'approved' && (
          <div>
            <div className="flex justify-between text-[10px] uppercase tracking-cta text-ink-5 mb-1">
              <span>Tempo da transação</span>
              <span aria-live="polite" className="font-mono">
                {seconds}s restantes
              </span>
            </div>
            <div
              className="h-1 bg-ink-2 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="h-full bg-coral-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {(phase === 'declined' || phase === 'timeout') && (
          <div className="border-t border-border pt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-tertiary"
              aria-label="Fechar e voltar para a tela de pagamento"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase('connecting');
                setElapsed(0);
              }}
              className="btn-primary inline-flex items-center gap-2"
              aria-label="Tentar transação novamente com outra adquirente"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Tentar outra adquirente
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
