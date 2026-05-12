import { ReactNode } from 'react';
import { AlertTriangle, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from './Modal';

type Tone = 'info' | 'warning' | 'danger' | 'success';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  body?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  tone?: Tone;
  loading?: boolean;
}

const TONE_ICON: Record<Tone, typeof AlertTriangle> = {
  info: Info,
  warning: AlertTriangle,
  danger: ShieldAlert,
  success: CheckCircle2,
};

const TONE_COLOR: Record<Tone, { bg: string; text: string; btn: string }> = {
  info: { bg: 'bg-coral-50', text: 'text-coral-500', btn: 'btn-primary' },
  warning: { bg: 'bg-warning-light', text: 'text-warning', btn: 'btn-primary' },
  danger: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    btn: 'inline-flex items-center justify-center gap-2 px-5 py-3 text-[11px] uppercase tracking-cta font-bold bg-danger text-white hover:bg-danger-light transition min-h-[44px]',
  },
  success: { bg: 'bg-success/15', text: 'text-success', btn: 'btn-primary' },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  body,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'info',
  loading = false,
}: Props) {
  const Icon = TONE_ICON[tone];
  const colors = TONE_COLOR[tone];

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch {
      /* erro tratado upstream via toast */
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="sm"
      hideClose={loading}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-tertiary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            aria-busy={loading}
            className={colors.btn}
          >
            {loading ? (
              <>
                <span
                  aria-hidden="true"
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                />
                Processando…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={clsx(
            'w-12 h-12 flex items-center justify-center flex-shrink-0',
            colors.bg,
            colors.text,
          )}
          aria-hidden="true"
        >
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          {description && (
            <p className="text-sm text-ink-6 leading-relaxed">{description}</p>
          )}
          {body && <div className="mt-3">{body}</div>}
        </div>
      </div>
    </Modal>
  );
}
