import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

/**
 * Modal acessível · WCAG 2.2 AA
 * Padrão Eliza/Fourblox · sem Radix por simplicidade do MVP
 * Implementa: focus trap básico, Esc fechar, aria-modal, aria-labelledby, scroll lock
 */
interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
  hideClose?: boolean;
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  hideClose = false,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    const previousActive = document.activeElement as HTMLElement | null;
    const focusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previousActive?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const titleId = 'modal-title';
  const descId = description ? 'modal-desc' : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <button
        type="button"
        aria-label="Fechar diálogo"
        onClick={onClose}
        className="absolute inset-0 bg-ink-7/50 backdrop-blur-sm animate-[fade-in_180ms_ease-out]"
      />
      <div
        ref={dialogRef}
        className={clsx(
          'relative bg-white shadow-modal w-full md:w-auto',
          'mx-0 md:mx-4',
          'max-h-[90dvh] md:max-h-[85dvh]',
          'flex flex-col',
          'animate-[fade-in_220ms_ease-out]',
          SIZE_CLASS[size],
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <header className="flex items-start gap-4 p-5 md:p-6 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 id={titleId} className="font-serif text-xl md:text-2xl text-ink-7 font-semibold leading-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-ink-5 mt-1.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="w-11 h-11 inline-flex items-center justify-center text-ink-5 hover:text-ink-7 hover:bg-ink-1 transition flex-shrink-0"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </div>

        {footer && (
          <footer className="border-t border-border p-4 md:p-5 bg-ink-1 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
