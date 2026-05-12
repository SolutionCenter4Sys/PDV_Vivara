import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Globe, Smartphone, MessageSquare, Mail, Link2, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from './Modal';
import { candidateIdentities } from '@/data/extendedMocks';
import type { CandidateIdentity } from '@/data/extendedMocks';
import type { Customer } from '@/types';
import { formatBRL, formatRelativeDate } from '@/utils/format';

/**
 * EP-03-F2 · Histórico Cross-channel · Mesclar identidades
 *
 * Detecta candidatas (e-commerce + app + WhatsApp + SAC) ligadas ao
 * cliente físico e permite ao vendedor confirmar a mesclagem com audit trail.
 *
 * Em produção · CDP (Twilio Segment / Bloomreach) entrega scores LGPD-safe.
 */

const CHANNEL_ICON: Record<CandidateIdentity['source'], typeof Globe> = {
  ecommerce: Globe,
  app: Smartphone,
  whatsapp: MessageSquare,
  sac: Mail,
};

const CHANNEL_LABEL: Record<CandidateIdentity['source'], string> = {
  ecommerce: 'E-commerce · vivara.com.br',
  app: 'App Vivara · iOS/Android',
  whatsapp: 'WhatsApp Business 1:1',
  sac: 'SAC · ticket Zendesk',
};

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer;
}

export function IdentityMergeDialog({ open, onClose, customer }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(candidateIdentities.filter((c) => c.matchScore >= 0.85).map((c) => c.id)),
  );
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    const chosen = candidateIdentities.filter((c) => selected.has(c.id));
    return {
      orders: chosen.reduce((s, c) => s + c.totalOrders, 0),
      ltv: chosen.reduce((s, c) => s + c.totalLTV, 0),
      count: chosen.length,
    };
  }, [selected]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMerge = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    onClose();
    toast.success('Identidades mescladas no CDP · LGPD-safe', {
      description: `${customer.name} agora tem ${totals.count} identidade${totals.count === 1 ? '' : 's'} ligada${totals.count === 1 ? '' : 's'} · audit trail SAP GRC.`,
    });
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={`Mesclar identidades · ${customer.name}`}
      description="CDP detectou identidades cross-channel · marque as que pertencem ao cliente."
      size="lg"
      hideClose={submitting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-tertiary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleMerge}
            disabled={submitting || selected.size === 0}
            aria-busy={submitting}
            className="btn-primary"
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                />
                Mesclando…
              </>
            ) : (
              <>
                <Link2 size={14} aria-hidden="true" />
                Mesclar {selected.size} identidade{selected.size === 1 ? '' : 's'}
              </>
            )}
          </button>
        </>
      }
    >
      <div className="bg-coral-50 border border-coral-200 p-3 mb-4 flex items-start gap-2 text-[12px] text-ink-7">
        <Sparkles size={14} aria-hidden="true" className="text-coral-500 mt-0.5 flex-shrink-0" />
        <div>
          <strong className="block uppercase tracking-cta text-[10px] text-coral-500 mb-1">
            Detecção LGPD-safe
          </strong>
          Match score ≥ 0,70 · sinais auditáveis · cliente pode pedir desmesclagem em qualquer momento via SAC.
        </div>
      </div>

      <ul role="list" className="space-y-2">
        {candidateIdentities.map((c) => {
          const Icon = CHANNEL_ICON[c.source];
          const checked = selected.has(c.id);
          const scorePct = Math.round(c.matchScore * 100);
          return (
            <li key={c.id}>
              <label
                className={clsx(
                  'card p-4 flex items-start gap-3 cursor-pointer transition',
                  checked
                    ? 'border-coral-500 bg-coral-50 ring-2 ring-coral-500/20'
                    : 'hover:bg-ink-1',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c.id)}
                  className="w-5 h-5 accent-coral-500 mt-0.5"
                  aria-label={`Mesclar ${CHANNEL_LABEL[c.source]}`}
                />
                <div
                  aria-hidden="true"
                  className={clsx(
                    'w-10 h-10 flex items-center justify-center flex-shrink-0',
                    checked ? 'bg-coral-500 text-white' : 'bg-ink-1 text-ink-7',
                  )}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sm">{CHANNEL_LABEL[c.source]}</strong>
                    <span
                      className={clsx(
                        'tag text-[10px]',
                        scorePct >= 90 && 'bg-success/15 text-success',
                        scorePct < 90 && scorePct >= 75 && 'bg-warning-light text-warning',
                        scorePct < 75 && 'bg-ink-2 text-ink-7',
                      )}
                    >
                      Match {scorePct}%
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-5 mt-0.5 font-mono">
                    {c.email && <span>{c.email}</span>}
                    {c.phone && <span> · {c.phone}</span>}
                    {c.cpf && <span> · CPF {c.cpf}</span>}
                  </div>
                  <div className="text-[12px] text-ink-6 mt-2">
                    <strong>{c.totalOrders}</strong> pedido{c.totalOrders === 1 ? '' : 's'} ·{' '}
                    LTV <strong>{formatBRL(c.totalLTV)}</strong> · última atividade {formatRelativeDate(c.lastSeenAt)}
                  </div>
                  <ul className="text-[11px] text-ink-5 mt-2 space-y-0.5">
                    {c.matchSignals.map((s) => (
                      <li key={s} className="flex items-start gap-1.5">
                        <span aria-hidden="true">·</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      {selected.size > 0 && (
        <div className="bg-ink-1 border border-border p-4 mt-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
              Identidades
            </div>
            <div className="font-serif text-2xl font-semibold text-ink-7">{totals.count}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">
              Pedidos somados
            </div>
            <div className="font-serif text-2xl font-semibold text-ink-7">{totals.orders}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5">LTV +</div>
            <div className="font-serif text-2xl font-semibold text-coral-500">
              {formatBRL(totals.ltv)}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
