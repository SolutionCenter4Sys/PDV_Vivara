/**
 * Fallback acessível para rotas com React.lazy.
 * Padrão Eliza/Fourblox · aria-busy + animação respeitando prefers-reduced-motion.
 */
export function RouteFallback() {
  return (
    <div
      className="min-h-[50dvh] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <span
          aria-hidden="true"
          className="inline-block w-10 h-10 border-2 border-coral-500 border-t-transparent rounded-full motion-safe:animate-spin"
        />
        <span className="text-[11px] uppercase tracking-cta font-bold text-ink-5">
          Carregando módulo…
        </span>
      </div>
    </div>
  );
}
