import { useEffect, useState } from 'react';
import { Smartphone, Tablet } from 'lucide-react';
import clsx from 'clsx';

/**
 * MposBadge · indicador de "Modo mPOS · vendedor móvel".
 *
 * Aparece quando o viewport está abaixo do breakpoint `lg` (1024px), refletindo
 * o uso do PDV em tablet ou celular (mobile POS) sem balcão. O vendedor mantém
 * a visão da loja através do dispositivo, com o Agente IA como "second brain".
 *
 * Em produção: o badge também consultaria `navigator.userAgentData` + flag de
 * checkout offline (LI-10) para qualificar como mPOS pleno.
 */
export function MposBadge() {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 640) setDevice('mobile');
      else if (w < 1024) setDevice('tablet');
      else setDevice('desktop');
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  if (device === 'desktop') return null;

  const Icon = device === 'mobile' ? Smartphone : Tablet;
  const label = device === 'mobile' ? 'mPOS · celular' : 'mPOS · tablet';

  return (
    <span
      role="status"
      aria-label={`Modo mPOS ativo · ${label}`}
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-1 min-h-[28px]',
        'bg-success/15 text-success text-[10px] uppercase tracking-cta font-bold',
        'border border-success/30',
      )}
      title="Modo mPOS · vendedor móvel · venda em qualquer ponto da loja"
    >
      <span className="relative flex w-1.5 h-1.5" aria-hidden="true">
        <span className="animate-ping absolute inset-0 rounded-full bg-success opacity-60" />
        <span className="relative w-1.5 h-1.5 rounded-full bg-success" />
      </span>
      <Icon size={11} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">mPOS</span>
    </span>
  );
}
