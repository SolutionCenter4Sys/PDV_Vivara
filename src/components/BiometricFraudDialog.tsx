import { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  X,
  Camera,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';
import { Modal } from './Modal';

/**
 * EP-05-F3 · LI-04 Anti-fraude Sensorial Real-time · biométrico opt-in.
 *
 * Acionado quando fraud score borderline (warning) e cliente é desconhecido
 * (sem CPF identificado). Cliente pega selfie · matched contra base
 * Vivara CDP (consentimento prévio LGPD) ou contra blacklist Serasa.
 *
 * Em produção · AWS Rekognition + Vivara CDP face-vector matching.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  onPass: () => void;
  onFail: () => void;
  fraudScore: number;
}

type Phase = 'consent' | 'capturing' | 'matching' | 'matched' | 'no_match' | 'declined';

export function BiometricFraudDialog({ open, onClose, onPass, onFail, fraudScore }: Props) {
  const [phase, setPhase] = useState<Phase>('consent');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setPhase('consent');
      setProgress(0);
    }
  }, [open]);

  useEffect(() => {
    if (phase === 'capturing') {
      const t = setTimeout(() => setPhase('matching'), 1800);
      return () => clearTimeout(t);
    }
    if (phase === 'matching') {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            const matched = Math.random() > 0.25;
            setPhase(matched ? 'matched' : 'no_match');
            return 100;
          }
          return p + 8;
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'matched') {
      const t = setTimeout(() => onPass(), 1400);
      return () => clearTimeout(t);
    }
  }, [phase, onPass]);

  const handleConsent = () => setPhase('capturing');
  const handleDecline = () => {
    setPhase('declined');
    onFail();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Verificação biométrica · LI-04"
      description={`Score borderline detectado · ${(fraudScore * 100).toFixed(0)}%`}
    >
      <div className="space-y-4">
        {phase === 'consent' && (
          <div className="space-y-4">
            <div className="bg-warning-light border border-warning/40 p-3 flex items-start gap-2">
              <AlertTriangle
                size={16}
                aria-hidden="true"
                className="text-warning mt-0.5 flex-shrink-0"
              />
              <div className="text-[12px] text-ink-7">
                Detectamos sinais sensoriais de risco moderado. Para liberar, precisamos validar a
                identidade do cliente com selfie. <strong>É 100% opcional</strong> e segue
                LGPD/CDC · alternativa: aprovação do gerente.
              </div>
            </div>

            <ul className="text-[12px] text-ink-6 space-y-1.5 list-disc pl-4">
              <li>Foto fica armazenada por 30 dias e é apagada</li>
              <li>Match contra base CDP Vivara (clientes com consentimento)</li>
              <li>Match contra blacklist Serasa Anti-Fraude</li>
              <li>Sem match · seguro escala gerente</li>
            </ul>

            <div className="border-t border-border-light pt-3 flex justify-end gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDecline}
                className="btn-tertiary inline-flex items-center gap-1"
              >
                <X size={14} aria-hidden="true" />
                Recusar · escalar gerente
              </button>
              <button
                type="button"
                onClick={handleConsent}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ScanFace size={14} aria-hidden="true" />
                Cliente concorda · capturar
              </button>
            </div>
          </div>
        )}

        {phase === 'capturing' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="relative">
              <div className="w-32 h-32 border-2 border-coral-500 flex items-center justify-center bg-ink-7 rounded-full">
                <Camera size={48} aria-hidden="true" className="text-coral-200 animate-pulse" />
              </div>
              <div className="absolute inset-0 border-2 border-coral-500 rounded-full animate-ping opacity-40" />
            </div>
            <div className="text-center">
              <div className="font-serif text-lg font-semibold">Posicione o rosto no frame</div>
              <p className="text-[12px] text-ink-5">Capturando · iluminação OK</p>
            </div>
          </div>
        )}

        {phase === 'matching' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 size={48} aria-hidden="true" className="animate-spin text-coral-500" />
            <div className="text-center">
              <div className="font-serif text-lg font-semibold">Comparando vetores faciais</div>
              <p className="text-[12px] text-ink-5">CDP Vivara · Serasa Anti-Fraude</p>
            </div>
            <div className="w-full max-w-xs">
              <div className="h-1 bg-ink-2 overflow-hidden">
                <div
                  className="h-full bg-coral-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {phase === 'matched' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 size={64} aria-hidden="true" className="text-success" />
            <div className="text-center">
              <div className="font-serif text-xl font-semibold">Cliente verificado</div>
              <p className="text-[12px] text-ink-5 max-w-xs">
                Match positivo · cliente Vivara CDP · risco baixo · liberar transação.
              </p>
            </div>
          </div>
        )}

        {phase === 'no_match' && (
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-3 py-3">
              <ShieldAlert size={56} aria-hidden="true" className="text-warning" />
              <div className="text-center">
                <div className="font-serif text-lg font-semibold">Sem match positivo</div>
                <p className="text-[12px] text-ink-5 max-w-sm">
                  Cliente não foi reconhecido. Para garantir segurança, escalar para o gerente
                  realizar análise complementar (documento físico).
                </p>
              </div>
            </div>
            <div className="border-t border-border-light pt-3 flex justify-end gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPhase('consent')}
                className="btn-tertiary inline-flex items-center gap-1"
              >
                <RotateCcw size={14} aria-hidden="true" />
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={onFail}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ShieldAlert size={14} aria-hidden="true" />
                Escalar para gerente
              </button>
            </div>
          </div>
        )}

        {phase === 'declined' && (
          <div className="text-center py-6">
            <X size={48} aria-hidden="true" className="text-ink-4 mx-auto mb-2" />
            <p className="font-serif text-lg font-semibold">Verificação dispensada</p>
            <p className="text-[12px] text-ink-5">Aprovação do gerente requerida.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
