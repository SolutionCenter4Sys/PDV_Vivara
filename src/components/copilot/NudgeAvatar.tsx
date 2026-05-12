import { Sparkles } from 'lucide-react';
import clsx from 'clsx';
import type { CustomerTier } from '@/types';

/**
 * Avatar do nudge com "tier ring" circular.
 *
 * Hierarquia visual de tier:
 *   Diamond → ring duplo coral + gold (premium look)
 *   Gold    → ring gold sólido
 *   Silver  → ring prata
 *   Standard→ ring neutro discreto
 *
 * Sem `customerName` cai num fallback Sparkles (nudge sem cliente).
 *
 * Acessibilidade: avatar é decorativo · cliente é nomeado no NudgeCard.
 * `aria-hidden="true"` é applied no svg/imagens internas.
 */
interface Props {
  customerName?: string;
  tier?: CustomerTier;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const SIZE_CLASS = {
  sm: 'w-9 h-9 text-[11px]',
  md: 'w-11 h-11 text-[13px]',
  lg: 'w-14 h-14 text-[15px]',
} as const;

const TIER_RING = {
  diamond: 'ring-2 ring-gold ring-offset-2 ring-offset-white',
  gold: 'ring-2 ring-gold/70 ring-offset-2 ring-offset-white',
  silver: 'ring-2 ring-ink-3 ring-offset-2 ring-offset-white',
  standard: 'ring-1 ring-border ring-offset-1 ring-offset-white',
} as const;

const TIER_LABEL = {
  diamond: 'Diamond',
  gold: 'Gold',
  silver: 'Silver',
  standard: 'Std',
} as const;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function NudgeAvatar({ customerName, tier, size = 'md', pulse = false }: Props) {
  const ring = tier ? TIER_RING[tier] : 'ring-1 ring-border ring-offset-1 ring-offset-white';
  const isDiamond = tier === 'diamond';

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className={clsx(
          SIZE_CLASS[size],
          'rounded-full inline-flex items-center justify-center font-serif font-semibold text-white select-none',
          ring,
          isDiamond
            ? 'bg-gradient-to-br from-ink-7 via-coral-500 to-gold'
            : 'bg-gradient-to-br from-ink-7 to-ink-6',
        )}
        aria-hidden="true"
      >
        {customerName ? (
          initials(customerName)
        ) : (
          <Sparkles size={size === 'lg' ? 20 : size === 'md' ? 16 : 14} />
        )}
      </div>
      {tier && (
        <span
          className={clsx(
            'absolute -bottom-1 -right-1 px-1.5 py-px text-[8px] uppercase tracking-cta font-bold rounded-full border-2 border-white whitespace-nowrap leading-none',
            tier === 'diamond' && 'bg-gold text-white',
            tier === 'gold' && 'bg-gold/85 text-white',
            tier === 'silver' && 'bg-ink-4 text-white',
            tier === 'standard' && 'bg-ink-2 text-ink-7',
          )}
          aria-label={`Tier ${TIER_LABEL[tier]}`}
        >
          {TIER_LABEL[tier][0]}
        </span>
      )}
      {pulse && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-coral-500 ring-2 ring-white animate-pulse-coral"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
