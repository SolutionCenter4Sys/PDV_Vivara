import clsx from 'clsx';

interface BaseProps {
  className?: string;
}

export function Skeleton({ className }: BaseProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={clsx(
        'animate-pulse bg-ink-2/70',
        className,
      )}
    >
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <article
      className="card flex flex-col"
      aria-busy="true"
      aria-label="Carregando produto"
    >
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-6 w-24 mt-2" />
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      role="status"
      aria-label="Carregando catálogo"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CustomerProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando ficha do cliente">
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border-light">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

export function DashboardKPISkeleton() {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      role="status"
      aria-label="Carregando KPIs"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}
