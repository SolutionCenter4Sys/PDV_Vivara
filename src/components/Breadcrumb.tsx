import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface Props {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function Breadcrumb({ items, showHome = true }: Props) {
  const tp = useTenantPath();
  const trail: BreadcrumbItem[] = showHome
    ? [{ label: 'Atendimento', to: tp('/') }, ...items]
    : items;

  return (
    <nav aria-label="Migalha" className="text-[11px] uppercase tracking-cta">
      <ol className="flex items-center gap-1 flex-wrap text-ink-5">
        {trail.map((item, idx) => {
          const isLast = idx === trail.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1">
              {idx === 0 && showHome && (
                <Home size={11} aria-hidden="true" className="mr-1" />
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="hover:text-coral-500 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-ink-7 font-bold' : 'font-medium'}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  size={12}
                  aria-hidden="true"
                  className="text-ink-4 mx-1"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
