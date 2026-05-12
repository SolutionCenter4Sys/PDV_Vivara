import { ReactNode } from 'react';
import clsx from 'clsx';

type IllustrationKind = 'search' | 'cart' | 'history' | 'wishlist' | 'service';

interface Props {
  illustration?: IllustrationKind;
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

function Illustration({ kind }: { kind: IllustrationKind }) {
  const baseProps = {
    width: 120,
    height: 120,
    viewBox: '0 0 120 120',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true as const,
    className: 'mb-6',
  };

  const VivaraV = (
    <g>
      <path
        d="M40 38 L60 78 L80 38"
        stroke="#E2725B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );

  switch (kind) {
    case 'search':
      return (
        <svg {...baseProps}>
          <circle cx="60" cy="60" r="56" fill="#FFF5F2" />
          <circle cx="52" cy="52" r="20" stroke="#1A1A1A" strokeWidth="2" fill="none" />
          <path
            d="M67 67 L82 82"
            stroke="#1A1A1A"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M44 52 L52 60 L62 46"
            stroke="#E2725B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    case 'cart':
      return (
        <svg {...baseProps}>
          <circle cx="60" cy="60" r="56" fill="#FFF5F2" />
          <path
            d="M30 38 H42 L48 76 H82"
            stroke="#1A1A1A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M44 50 H86 L80 70 H50"
            stroke="#1A1A1A"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="54" cy="86" r="3" fill="#1A1A1A" />
          <circle cx="78" cy="86" r="3" fill="#1A1A1A" />
          {VivaraV}
        </svg>
      );
    case 'history':
      return (
        <svg {...baseProps}>
          <circle cx="60" cy="60" r="56" fill="#FFF5F2" />
          <circle cx="60" cy="60" r="26" stroke="#1A1A1A" strokeWidth="2" fill="none" />
          <path
            d="M60 44 V60 L72 68"
            stroke="#E2725B"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case 'wishlist':
      return (
        <svg {...baseProps}>
          <circle cx="60" cy="60" r="56" fill="#FFF5F2" />
          <path
            d="M60 82 C40 70 32 58 32 48 C32 40 38 34 46 34 C52 34 57 38 60 42 C63 38 68 34 74 34 C82 34 88 40 88 48 C88 58 80 70 60 82 Z"
            stroke="#E2725B"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    case 'service':
      return (
        <svg {...baseProps}>
          <circle cx="60" cy="60" r="56" fill="#FFF5F2" />
          <path
            d="M40 80 L70 50 M70 50 L80 60 L50 90 L40 80 Z"
            stroke="#1A1A1A"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="78" cy="42" r="8" stroke="#E2725B" strokeWidth="2" fill="none" />
        </svg>
      );
    default:
      return null;
  }
}

export function EmptyState({
  illustration = 'search',
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: Props) {
  return (
    <div
      role="status"
      className={clsx(
        'flex flex-col items-center justify-center text-center py-14 px-6 bg-white border border-dashed border-border',
        className,
      )}
    >
      <Illustration kind={illustration} />
      <h2 className="text-xl text-ink-7 mb-2 font-display">{title}</h2>
      {description && (
        <p className="text-sm text-ink-5 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {primaryAction}
        {secondaryAction}
      </div>
    </div>
  );
}
