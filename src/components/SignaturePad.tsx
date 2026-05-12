import { useEffect, useRef, useState } from 'react';
import { Eraser, PenLine } from 'lucide-react';

/**
 * Pad de assinatura digital · canvas HTML5 com touch + mouse.
 * Acessível: respeita prefers-reduced-motion; estado disponível via aria-live.
 *
 * Uso típico (EP-04-F1 · F1-FE-04 · entrega da OS · cliente assina recibo):
 * <SignaturePad onChange={(dataUrl, isEmpty) => …} />
 */

interface Props {
  width?: number;
  height?: number;
  onChange?: (dataUrl: string, isEmpty: boolean) => void;
  ariaLabel?: string;
}

export function SignaturePad({
  width = 480,
  height = 180,
  onChange,
  ariaLabel = 'Pad de assinatura · arraste o dedo ou cursor para assinar',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(window.devicePixelRatio, 1);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#1a1a1a';
  }, [width, height]);

  const getPos = (e: PointerEvent | React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ('clientX' in e ? e.clientX : 0) - rect.left,
      y: ('clientY' in e ? e.clientY : 0) - rect.top,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = getPos(e);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx || !last.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
    if (isEmpty) setIsEmpty(false);
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (onChange && canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'), false);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange?.('', true);
  };

  return (
    <div className="space-y-2">
      <div
        className="relative border-2 border-dashed border-border bg-white"
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          aria-label={ariaLabel}
          role="img"
          className="w-full h-full touch-none cursor-crosshair"
        />
        {isEmpty && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-ink-4 text-[12px] uppercase tracking-cta font-bold pointer-events-none"
          >
            <PenLine size={14} className="mr-2" />
            Assine aqui
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3" aria-live="polite">
        <span className="text-[11px] text-ink-5">
          {isEmpty ? 'Sem assinatura · obrigatório' : 'Assinatura capturada · pode prosseguir'}
        </span>
        <button
          type="button"
          onClick={clear}
          disabled={isEmpty}
          className="btn-tertiary p-0 text-[11px]"
        >
          <Eraser size={11} aria-hidden="true" /> Limpar
        </button>
      </div>
    </div>
  );
}
