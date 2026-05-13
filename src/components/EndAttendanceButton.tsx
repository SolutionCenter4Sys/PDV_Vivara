import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UserMinus,
  RefreshCw,
  AlertTriangle,
  X,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { Modal } from './Modal';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { formatBRL } from '@/utils/format';

/**
 * EndAttendanceButton · encerra a sessao de atendimento ativa.
 *
 * Comportamento:
 *   - Se a sacola esta vazia, encerra direto + toast neutro.
 *   - Se ha itens, abre Modal de confirmacao destacando que a sacola sera
 *     descartada (regra de negocio: turno = 1 cliente por vez, sacola nao
 *     migra entre atendimentos para evitar trocar item em ticket errado).
 *
 * Visualmente respeita 4 variantes para diferentes superficies do PDV.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'icon';

interface Props {
  variant?: Variant;
  /**
   * Texto principal. Default por variante:
   *   primary/secondary: "Trocar atendimento"
   *   ghost: "Encerrar atendimento"
   *   icon: usa apenas icone + tooltip
   */
  label?: string;
  /** Para onde navegar apos encerrar. Default: home da loja (`/`). */
  redirectTo?: string;
  className?: string;
  /** Disparado depois do dispatch (util para fechar dialog/menu). */
  onAfterEnd?: () => void;
}

export function EndAttendanceButton({
  variant = 'primary',
  label,
  redirectTo,
  className,
  onAfterEnd,
}: Props) {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const activeCustomer = usePosStore((s) => s.activeCustomer);
  const cart = usePosStore((s) => s.cart);
  const cartTotal = usePosStore((s) => s.cartTotal);
  const cartCount = usePosStore((s) => s.cartCount);
  const endAttendance = usePosStore((s) => s.endAttendance);
  const titleId = useId();

  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!activeCustomer) return null;

  const itemsCount = cartCount();
  const total = cartTotal();
  const hasItems = cart.length > 0 && itemsCount > 0;

  const defaultLabel =
    variant === 'ghost' ? 'Encerrar atendimento' : 'Trocar atendimento';
  const buttonLabel = label ?? defaultLabel;

  function doEnd() {
    const customerName = activeCustomer?.name ?? 'cliente';
    endAttendance();
    setConfirmOpen(false);
    onAfterEnd?.();
    toast.success(`Atendimento de ${customerName.split(' ')[0]} encerrado`, {
      description: hasItems
        ? `Sacola descartada (${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'}). Pronto para o proximo cliente.`
        : 'Pronto para identificar o proximo cliente.',
    });
    navigate(tp(redirectTo ?? '/'));
  }

  function handleClick() {
    if (hasItems) {
      setConfirmOpen(true);
    } else {
      doEnd();
    }
  }

  const baseClasses = clsx(
    'inline-flex items-center justify-center gap-1.5 transition',
    variant === 'primary' &&
      'px-3 py-2 min-h-[40px] text-[11px] uppercase tracking-cta font-bold border border-ink-7 text-ink-7 hover:bg-ink-7 hover:text-white',
    variant === 'secondary' &&
      'px-3 py-2 min-h-[40px] text-[11px] uppercase tracking-cta font-bold bg-white border border-coral-300 text-coral-600 hover:bg-coral-500 hover:text-white hover:border-coral-500',
    variant === 'ghost' &&
      'px-2.5 py-1.5 text-[11px] uppercase tracking-cta font-bold text-ink-5 hover:text-rose-600',
    variant === 'icon' &&
      'w-8 h-8 text-coral-500 hover:bg-coral-100',
    className,
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={baseClasses}
        aria-label={`${buttonLabel} de ${activeCustomer.name}`}
        title={hasItems ? `${buttonLabel} (sacola sera descartada)` : buttonLabel}
      >
        {variant === 'icon' ? (
          <X size={14} aria-hidden="true" />
        ) : (
          <>
            {variant === 'ghost' ? (
              <UserMinus size={12} aria-hidden="true" />
            ) : (
              <RefreshCw size={12} aria-hidden="true" />
            )}
            <span>{buttonLabel}</span>
          </>
        )}
      </button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
        title="Encerrar atendimento atual?"
        description={`Voce esta atendendo ${activeCustomer.name}.`}
      >
        <div className="space-y-4" aria-labelledby={titleId}>
          <div className="border border-warning bg-warning/10 p-3 flex items-start gap-2">
            <AlertTriangle
              size={16}
              className="text-warning flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="text-[12px] text-ink-7 leading-snug">
              <strong>A sacola sera descartada</strong> · {itemsCount}{' '}
              {itemsCount === 1 ? 'peca' : 'pecas'} no valor de{' '}
              <strong className="font-mono tabular-nums">{formatBRL(total)}</strong>{' '}
              serao removidas. Para preservar a venda, finalize o pagamento antes
              de trocar de cliente.
            </div>
          </div>

          <ul className="text-[12px] text-ink-6 space-y-1.5 pl-5">
            <li className="flex items-start gap-2 -ml-5">
              <ShoppingBag size={12} className="text-ink-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              {itemsCount} {itemsCount === 1 ? 'item' : 'itens'} na sacola serao perdidos.
            </li>
            <li className="flex items-start gap-2 -ml-5">
              <UserMinus size={12} className="text-ink-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              {activeCustomer.name} deixa de estar vinculado a este turno.
            </li>
            <li className="flex items-start gap-2 -ml-5">
              <RefreshCw size={12} className="text-ink-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              Voce volta para a tela de atendimento, pronto para identificar o proximo cliente.
            </li>
          </ul>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2 border-t border-border-light">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="btn-tertiary"
            >
              Continuar atendimento
            </button>
            <button
              type="button"
              onClick={doEnd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] text-[12px] uppercase tracking-cta font-bold bg-rose-600 text-white hover:bg-rose-700 transition"
            >
              <Trash2 size={14} aria-hidden="true" />
              Descartar sacola e encerrar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
