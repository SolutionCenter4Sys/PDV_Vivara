import { Link } from 'react-router-dom';
import type { Customer } from '@/types';
import { formatBRL, formatRelativeDate, tierLabel } from '@/utils/format';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import clsx from 'clsx';

interface Props {
  customer: Customer;
  compact?: boolean;
}

const tierColor: Record<string, string> = {
  diamond: 'bg-ink-7 text-white',
  gold: 'bg-gold text-white',
  silver: 'bg-ink-3 text-ink-7',
  standard: 'bg-ink-2 text-ink-7',
};

export function CustomerCard({ customer, compact = false }: Props) {
  const tp = useTenantPath();
  const initials = customer.name
    .split(' ')
    .slice(0, 2)
    .map(p => p.charAt(0))
    .join('');

  return (
    <Link
      to={tp(`/cliente/${customer.id}`)}
      className={clsx(
        'flex items-center gap-3 card hover:bg-coral-50 transition',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-serif font-semibold flex-shrink-0',
          customer.tier === 'diamond' ? 'bg-ink-7 text-white' : 'bg-coral-500 text-white',
          compact ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg',
        )}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-ink-7 truncate">{customer.name}</span>
          <span className={clsx('tag', tierColor[customer.tier])}>{tierLabel(customer.tier)}</span>
        </div>
        <div className="text-[11px] text-ink-5 flex flex-wrap gap-x-2 gap-y-0">
          <span>LTV {formatBRL(customer.totalLTV)}</span>
          <span>·</span>
          <span>Última compra {formatRelativeDate(customer.lastPurchaseISO)}</span>
        </div>
      </div>
    </Link>
  );
}
