import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ScanFace,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CameraOff,
} from 'lucide-react';
import clsx from 'clsx';
import { mockFaceMatch, type FaceMatchResult } from '@/data/mocks';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';

/**
 * FacialRecognitionPanel · identificação biométrica do cliente.
 *
 * Em produção: classifier on-device (Jetson Orin / NPU do tablet) que extrai
 * embedding facial e busca em índice vetorial dos clientes opt-in. Aqui
 * simulamos o fluxo completo:
 *
 *   1. Pede `getUserMedia({ video })` para mostrar preview real do vendedor/
 *      cliente. Permissão real garante o efeito visual "ao vivo".
 *   2. Após 2.5s passa para `matched` com cliente sorteado entre os com
 *      `optInLI: true` (LGPD-by-design).
 *   3. Se a câmera não está disponível ou a permissão for negada, faz fallback
 *      para uma simulação 100% mock (sem preview) em 1.4s.
 *
 * O `MediaStream` é sempre encerrado no unmount/match para não deixar a
 * câmera ligada além do necessário.
 */

type Phase =
  | 'idle'
  | 'requesting'
  | 'streaming'
  | 'mock-running'
  | 'matched'
  | 'error';

interface Props {
  onClose: () => void;
  /** Disparado quando um cliente é identificado · útil para o pai fechar o dialog. */
  onMatched?: (customerId: string) => void;
}

const SCAN_DURATION_MS = 2500;
const MOCK_DURATION_MS = 1400;

export function FacialRecognitionPanel({ onClose, onMatched }: Props) {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const selectCustomer = usePosStore((s) => s.selectCustomer);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [match, setMatch] = useState<FaceMatchResult | null>(null);
  const [usingMockOnly, setUsingMockOnly] = useState(false);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {
        /* noop */
      }
    }
  }

  function clearTimer() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
    };
  }, []);

  function finalizeMatch(result: FaceMatchResult, mockOnly: boolean) {
    setMatch(result);
    setPhase('matched');
    setUsingMockOnly(mockOnly);
    stopStream();
    selectCustomer(result.customer);
    toast.success(`Reconhecimento facial · ${result.customer.name}`, {
      description: `Match ${(result.confidence * 100).toFixed(0)}% em ${result.latencyMs}ms · embeddings on-device.`,
    });
    onMatched?.(result.customer.id);
    // Pequeno delay antes de navegar para o vendedor enxergar o resultado
    timeoutRef.current = window.setTimeout(() => {
      navigate(tp(`/cliente/${result.customer.id}`));
      onClose();
    }, 900);
  }

  function runMockFlow() {
    setPhase('mock-running');
    setUsingMockOnly(true);
    clearTimer();
    timeoutRef.current = window.setTimeout(() => {
      const result = mockFaceMatch();
      if (!result) {
        setErrorMsg('Nenhum cliente com opt-in biométrico encontrado.');
        setPhase('error');
        return;
      }
      finalizeMatch(result, true);
    }, MOCK_DURATION_MS);
  }

  async function startCamera() {
    setErrorMsg(null);
    setMatch(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      runMockFlow();
      return;
    }

    setPhase('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          /* play pode rejeitar se o componente desmontar — ok */
        }
      }
      setPhase('streaming');
      clearTimer();
      timeoutRef.current = window.setTimeout(() => {
        const result = mockFaceMatch();
        if (!result) {
          setErrorMsg('Nenhum cliente com opt-in biométrico encontrado.');
          setPhase('error');
          stopStream();
          return;
        }
        finalizeMatch(result, false);
      }, SCAN_DURATION_MS);
    } catch (err) {
      stopStream();
      const reason =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Permissão de câmera negada.'
          : 'Câmera indisponível neste dispositivo.';
      setErrorMsg(reason);
      // Fallback gracioso · entra em modo mock direto
      runMockFlow();
    }
  }

  const showVideo = phase === 'requesting' || phase === 'streaming';
  const isWorking = phase === 'requesting' || phase === 'streaming' || phase === 'mock-running';

  return (
    <section
      aria-label="Reconhecimento facial do cliente"
      className="border border-coral-200 bg-coral-50/40 p-4 md:p-5 space-y-4"
    >
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1 inline-flex items-center gap-1.5">
            <ScanFace size={12} aria-hidden="true" />
            Identificação biométrica · Agente IA
          </div>
          <h3 className="font-serif text-lg md:text-xl text-ink-7">
            Olhe para a câmera e o cliente é reconhecido em segundos
          </h3>
        </div>
        {phase === 'idle' && (
          <button
            type="button"
            onClick={startCamera}
            className="btn-primary inline-flex items-center gap-2"
            aria-label="Iniciar reconhecimento facial"
          >
            <ScanFace size={14} aria-hidden="true" />
            Iniciar
          </button>
        )}
        {(phase === 'matched' || phase === 'error') && (
          <button
            type="button"
            onClick={() => {
              setPhase('idle');
              setMatch(null);
              setErrorMsg(null);
            }}
            className="btn-secondary btn-sm"
            aria-label="Reiniciar reconhecimento"
          >
            Reiniciar
          </button>
        )}
      </header>

      <div className="relative w-full max-w-[420px] mx-auto aspect-[4/3] bg-ink-7 overflow-hidden">
        {/* Vídeo real (ou container vazio em modo mock) */}
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={clsx(
            'w-full h-full object-cover transition-opacity duration-300',
            showVideo ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={!showVideo}
        />

        {/* Placeholder visual quando em mock-running ou idle (sem stream) */}
        {!showVideo && (phase === 'mock-running' || phase === 'idle' || phase === 'error') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-7 via-ink-6 to-ink-7">
            {phase === 'idle' && (
              <ScanFace size={56} className="text-coral-300 opacity-50" aria-hidden="true" />
            )}
            {phase === 'mock-running' && (
              <div className="text-center text-white/80 space-y-2">
                <Loader2 size={36} className="text-coral-300 animate-spin mx-auto" aria-hidden="true" />
                <div className="text-[10px] uppercase tracking-cta font-bold text-coral-200">
                  Modo simulado · sem câmera
                </div>
              </div>
            )}
            {phase === 'error' && !match && (
              <div className="text-center text-white/80 space-y-2 px-4">
                <CameraOff size={36} className="text-rose-300 mx-auto" aria-hidden="true" />
                <div className="text-[11px] text-rose-100">{errorMsg}</div>
              </div>
            )}
          </div>
        )}

        {/* Overlay de scanning · só durante streaming/mock-running */}
        {isWorking && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div className="relative w-48 h-56 border-2 border-coral-300/80 rounded-3xl">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-coral-500 animate-scan-bar motion-reduce:animate-none" />
              <span className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-coral-500" />
              <span className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-coral-500" />
              <span className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-coral-500" />
              <span className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-coral-500" />
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-3 py-1 bg-ink-7/80 text-coral-200 text-[10px] uppercase tracking-cta font-bold rounded-full">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inset-0 rounded-full bg-coral-400 opacity-60" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-coral-500" />
              </span>
              Procurando rosto…
            </div>
          </div>
        )}

        {/* Card de match concluído */}
        {phase === 'matched' && match && (
          <div className="absolute inset-0 bg-success/90 text-white flex flex-col items-center justify-center text-center p-4">
            <CheckCircle2 size={42} aria-hidden="true" />
            <div className="font-serif text-xl mt-2">{match.customer.name}</div>
            <div className="text-[11px] uppercase tracking-cta font-bold mt-1 opacity-90">
              Match {(match.confidence * 100).toFixed(0)}% · {match.latencyMs}ms
            </div>
            {usingMockOnly && (
              <div className="text-[10px] uppercase tracking-cta opacity-80 mt-1">
                · simulação local sem câmera ·
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helpers contextuais */}
      {phase === 'idle' && (
        <p className="text-[12px] text-ink-6 leading-snug">
          O navegador vai pedir autorização para usar a câmera. Em seguida, o Agente IA
          compara o rosto com clientes que tenham opt-in biométrico ativo.
        </p>
      )}

      {phase === 'matched' && match && (
        <div className="flex items-center justify-center gap-2 text-[12px] text-ink-6">
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          Abrindo a Visão 360° de {match.customer.name.split(' ')[0]}…
        </div>
      )}

      {phase === 'error' && match === null && (
        <div className="flex items-center gap-2 text-[12px] text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2">
          <AlertTriangle size={14} aria-hidden="true" />
          {errorMsg ?? 'Não foi possível concluir o reconhecimento.'}
        </div>
      )}

      <footer className="flex items-start gap-2 text-[10px] uppercase tracking-cta text-ink-5 border-t border-coral-200 pt-3">
        <ShieldCheck size={11} className="text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span className="leading-snug normal-case tracking-normal text-ink-6">
          <strong className="text-ink-7 uppercase tracking-cta">LGPD-by-design:</strong>{' '}
          embeddings calculados on-device · nenhum frame de imagem sai do dispositivo · só
          clientes com opt-in biométrico podem ser reconhecidos.
        </span>
      </footer>
    </section>
  );
}
