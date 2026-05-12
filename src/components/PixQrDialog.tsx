import { useEffect, useMemo, useState } from 'react';
import { QrCode, Copy, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Modal } from './Modal';
import { formatBRL } from '@/utils/format';

/**
 * EP-01-F5-FE-03 · QR Code PIX dedicado + Copia-e-Cola.
 *
 * Mock do payload BR Code (BACEN PIX) gerado pelo PSP da Vivara.
 * Em produção · request POST /pix/charge → retorna `qrCode` (BR Code) e
 * `txid`. Polling no /pix/status/{txid} faz transição para "approved".
 */

interface Props {
  open: boolean;
  onClose: () => void;
  amount: number;
  onApproved: () => void;
}

const TIMEOUT_SECS = 60; // BACEN máximo de aguarde antes de cancelar

function generateBrCode(amount: number): string {
  // Mock simplificado de BR Code · campos seguem ISO 20022 / BACEN PIX.
  const txid = Math.random().toString(36).slice(2, 12).toUpperCase();
  return [
    '00020126360014BR.GOV.BCB.PIX',
    '0114+551130303030',
    '52040000',
    '5303986',
    `54${String(amount.toFixed(2).length).padStart(2, '0')}${amount.toFixed(2)}`,
    '5802BR',
    '5916VIVARA SA',
    '6009SAO PAULO',
    `62200516${txid}`,
    '6304ABCD',
  ].join('');
}

export function PixQrDialog({ open, onClose, amount, onApproved }: Props) {
  const [seconds, setSeconds] = useState(TIMEOUT_SECS);
  const [status, setStatus] = useState<'waiting' | 'approved' | 'timeout'>('waiting');
  const brCode = useMemo(() => generateBrCode(amount), [amount, open]);

  useEffect(() => {
    if (!open) {
      setSeconds(TIMEOUT_SECS);
      setStatus('waiting');
      return;
    }
    if (status !== 'waiting') return;
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setStatus('timeout');
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // Mock · simula aprovação automática em 6-12s
    const apvDelay = 6000 + Math.random() * 6000;
    const apvTimer = setTimeout(() => {
      setStatus('approved');
      clearInterval(interval);
    }, apvDelay);

    return () => {
      clearInterval(interval);
      clearTimeout(apvTimer);
    };
  }, [open, status]);

  useEffect(() => {
    if (status === 'approved') {
      const t = setTimeout(() => onApproved(), 1200);
      return () => clearTimeout(t);
    }
  }, [status, onApproved]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(brCode);
      toast.success('Copia-e-Cola copiado', {
        description: 'Cliente pode colar no app do banco para pagar.',
      });
    } catch {
      toast.error('Não foi possível copiar · selecione manualmente');
    }
  };

  const handleRetry = () => {
    setSeconds(TIMEOUT_SECS);
    setStatus('waiting');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Pagamento via PIX"
      description={`Valor: ${formatBRL(amount)} · BACEN`}
    >
      <div className="space-y-5">
        {status === 'waiting' && (
          <>
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white border-2 border-ink-7 p-6 inline-block">
                <QrCode
                  size={180}
                  strokeWidth={1}
                  aria-hidden="true"
                  className="text-ink-7"
                />
              </div>
              <div className="text-[11px] uppercase tracking-cta font-bold text-ink-5 inline-flex items-center gap-2">
                <Clock size={14} aria-hidden="true" />
                Aguardando pagamento · expira em{' '}
                <span className={clsx('font-mono', seconds <= 15 ? 'text-danger' : 'text-ink-7')}>
                  {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                  {String(seconds % 60).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="border border-border bg-ink-1 p-3">
              <div className="text-[10px] uppercase tracking-cta font-bold text-ink-5 mb-2">
                Copia-e-Cola
              </div>
              <code className="block font-mono text-[11px] text-ink-7 break-all leading-relaxed">
                {brCode}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-cta font-bold border border-ink-7 text-ink-7 hover:bg-ink-7 hover:text-white transition"
                aria-label="Copiar BR Code para área de transferência"
              >
                <Copy size={14} aria-hidden="true" />
                Copiar
              </button>
            </div>

            <div className="text-[10px] text-ink-4 uppercase tracking-cta border-t border-border-light pt-3">
              PIX BACEN · liquidação imediata · transação rastreada via DICT
            </div>
          </>
        )}

        {status === 'approved' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 size={64} aria-hidden="true" className="text-success" />
            <h3 className="font-serif text-2xl font-semibold">Pagamento aprovado</h3>
            <p className="text-[12px] text-ink-5 text-center">
              PIX confirmado pelo banco · NFC-e será emitida em seguida.
            </p>
          </div>
        )}

        {status === 'timeout' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Clock size={48} aria-hidden="true" className="text-warning" />
            <h3 className="font-serif text-xl font-semibold">QR Code expirado</h3>
            <p className="text-[12px] text-ink-5 text-center max-w-xs">
              O cliente não concluiu o pagamento. Gere novo QR ou troque a forma de pagamento.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="btn-primary inline-flex items-center gap-2 mt-2"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Gerar novo QR
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
