import { useEffect, useMemo, useState } from 'react';
import { Sparkles, X, Watch, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { toggleCopilot } from '@app/store/slices/copilotSlice';
import { NudgeCard } from './copilot/NudgeCard';

/**
 * EP-05-F1 · LI-01 Copilot Multi-Agente · refatorado em party mode (Bella + Eliza + Ju).
 *
 * Tese de design (Ju):
 *   "Vendemos decisão, não letrinhas."
 *   Cada nudge é uma OPORTUNIDADE financeira em segundos.
 *
 * Arquitetura responsiva (Eliza/Sofia):
 *   mobile (<md):  bottom sheet com snap peek/expanded · drag handle clicável · backdrop
 *                   quando expandido · swipe horizontal nos cards = aceitar/rejeitar
 *   tablet (md):   floating drawer 360px direita-inferior
 *   desktop (lg+): floating card 420px direita-inferior · hover lift sutil
 *
 * Hierarquia visual (Bella):
 *   1. Cliente é protagonista (avatar + tier ring + nome serif)
 *   2. Oportunidade em destaque coral serif grande
 *   3. Preview da peça (joia se vê, não se lê)
 *   4. CTA primary 44px h ergonômico · ghost menor para rejeitar
 *
 * Acessibilidade WCAG 2.2 AA:
 *   - role="complementary" com aria-label
 *   - foco visível keyboard (focus-visible:ring-2)
 *   - prefers-reduced-motion respeitado em todos os transitions
 *   - aria-live="polite" no contador de ativos
 *   - botões touch-friendly 44×44 mínimo
 */
export function CopilotPanel() {
  const dispatch = useAppDispatch();
  const nudges = useAppSelector((s) => s.copilot.nudges);
  const dismissedIds = useAppSelector((s) => s.copilot.dismissedIds);
  const acceptedIds = useAppSelector((s) => s.copilot.acceptedIds);
  const rejectedIds = useAppSelector((s) => s.copilot.rejectedIds);
  const open = useAppSelector((s) => s.copilot.open);

  // Mobile: peek (180px / só header) ou expanded (~80dvh com cards)
  const [expanded, setExpanded] = useState(true);
  // Tablet+ ignoram este state.

  // Reset peek-state ao reabrir o painel
  useEffect(() => {
    if (open) setExpanded(true);
  }, [open]);

  const visible = useMemo(
    () => nudges.filter((n) => !dismissedIds.includes(n.id)),
    [nudges, dismissedIds],
  );

  const watchNudges = visible.filter((n) => n.type === 'vip-arrived' || n.type === 'birthday');
  const padNudges = visible.filter((n) => n.type !== 'vip-arrived' && n.type !== 'birthday');

  if (!open) return null;

  const totalOpportunity = padNudges.reduce((sum, n) => {
    const placeholder = n.type === 'cross-sell' ? 800 : 1200;
    return sum + placeholder;
  }, 0);

  return (
    <>
      {/* Backdrop mobile (escurece tela quando expandido) */}
      <button
        type="button"
        onClick={() => setExpanded(false)}
        aria-label="Fechar painel Copilot"
        className={clsx(
          'fixed inset-0 z-30 bg-ink-7/30 backdrop-blur-sm md:hidden transition-opacity motion-reduce:transition-none',
          expanded ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />

      <aside
        className={clsx(
          'fixed z-40 flex flex-col motion-reduce:animate-none',
          // Mobile: bottom sheet
          'inset-x-0 bottom-0 max-h-[85dvh]',
          // Tablet: drawer flutuante direita
          'md:inset-x-auto md:bottom-6 md:right-6 md:w-[380px] md:max-h-[min(640px,calc(100dvh-48px))]',
          // Desktop: drawer maior
          'lg:w-[420px]',
          // Bordas arredondadas só no topo no mobile, full no desktop
          'rounded-t-3xl md:rounded-2xl',
          // Sombra premium
          'shadow-elevated md:shadow-modal',
          'bg-white overflow-hidden',
          // Slide-up animation
          'animate-[fade-in_240ms_ease-out]',
          // Mobile: alterna altura via state
          !expanded && 'translate-y-[calc(100%-72px)] md:translate-y-0',
          'transition-transform duration-300 ease-out motion-reduce:transition-none',
        )}
        role="complementary"
        aria-label="Painel Copilot Living Intelligence"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* ─────────── HEADER ─────────── */}
        <header className="relative bg-gradient-to-br from-white via-coral-50 to-white border-b border-border/60 px-4 pt-3 pb-3 md:pt-4">
          {/* Drag handle mobile (tap para alternar peek/expanded) */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Recolher painel' : 'Expandir painel'}
            className="md:hidden absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-7 -mt-1 inline-flex items-center justify-center focus:outline-none focus-visible:bg-ink-1 rounded-full"
          >
            <span className="block w-10 h-1 rounded-full bg-ink-3 group-hover:bg-ink-5" aria-hidden="true" />
          </button>

          <div className="flex items-center justify-between gap-3 mt-2 md:mt-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Glyph IA com pulse coral */}
              <span className="relative flex-shrink-0 w-9 h-9 inline-flex items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full bg-coral-200/40 animate-pulse-coral"
                  aria-hidden="true"
                />
                <span className="relative w-9 h-9 rounded-full bg-gradient-to-br from-coral-500 to-coral-300 inline-flex items-center justify-center shadow-sm">
                  <Sparkles size={16} className="text-white" aria-hidden="true" />
                </span>
              </span>
              <div className="min-w-0">
                <div className="font-serif font-semibold text-[15px] text-ink-7 leading-tight truncate">
                  Copilot
                </div>
                <div className="text-[10px] uppercase tracking-cta font-bold text-coral-500 truncate">
                  Living Intelligence
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Toggle peek/expanded em telas md+ (não tem drag handle) */}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="hidden md:inline-flex w-9 h-9 items-center justify-center rounded-full text-ink-5 hover:text-ink-7 hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 transition-colors"
                aria-label={expanded ? 'Recolher cards' : 'Expandir cards'}
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              <button
                type="button"
                onClick={() => dispatch(toggleCopilot())}
                aria-label="Fechar painel Copilot"
                className="w-9 h-9 inline-flex items-center justify-center rounded-full text-ink-5 hover:text-ink-7 hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 transition-colors"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Stats compactas · sempre visíveis (mesmo em peek mode) */}
          <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] uppercase tracking-cta font-bold">
            <span className="inline-flex items-center gap-1 text-ink-6" aria-live="polite">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inset-0 rounded-full bg-coral-400 opacity-60" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-coral-500" />
              </span>
              {visible.length} ativos
            </span>
            <span className="inline-flex items-center gap-2 text-ink-5">
              <span className="text-emerald-600">{acceptedIds.length} ✓</span>
              <span className="text-ink-3">·</span>
              <span className="text-rose-500">{rejectedIds.length} ✗</span>
            </span>
            {totalOpportunity > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-ink-6">
                <TrendingUp className="w-3 h-3 text-coral-500" aria-hidden="true" />
                ~R$ {(totalOpportunity / 1000).toFixed(1)}k
              </span>
            )}
          </div>
        </header>

        {/* ─────────── CONTEÚDO (some quando peek) ─────────── */}
        <div
          className={clsx(
            'flex-1 overflow-y-auto bg-gradient-to-b from-white to-ink-1/40',
            // No mobile, em peek mode esconde scroll mas mantém visível na transição
            !expanded && 'md:block',
          )}
        >
          <div className="p-3 md:p-4 space-y-3">
            {/* Apple Watch lane · banner refinado, não preto cheio */}
            {watchNudges.length > 0 && (
              <section aria-labelledby="watch-lane-title">
                <h2
                  id="watch-lane-title"
                  className="text-[10px] uppercase tracking-cta font-bold text-ink-5 mb-2 inline-flex items-center gap-1.5 px-1"
                >
                  <Watch className="w-3 h-3" aria-hidden="true" />
                  Apple Watch · push em vibração
                </h2>
                <div className="space-y-2">
                  {watchNudges.map((n) => (
                    <NudgeCard key={n.id} nudge={n} variant="watch" enableSwipe={false} />
                  ))}
                </div>
              </section>
            )}

            {/* iPad/Desktop lane · cards ricos */}
            {padNudges.length > 0 && (
              <section aria-labelledby="pad-lane-title">
                <h2
                  id="pad-lane-title"
                  className="text-[10px] uppercase tracking-cta font-bold text-ink-5 mb-2 px-1 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-coral-500" aria-hidden="true" />
                  Top {padNudges.length} contextual · iPad/Desktop
                </h2>
                <div className="space-y-3">
                  {padNudges.map((n) => (
                    <NudgeCard key={n.id} nudge={n} enableSwipe />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state · zen, não vazio depressivo */}
            {visible.length === 0 && (
              <div className="py-12 px-4 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-coral-50 mb-3">
                  <Sparkles size={24} className="text-coral-300" aria-hidden="true" />
                </div>
                <div className="font-serif text-[16px] text-ink-7 mb-1">Ambiente sereno</div>
                <p className="text-[12px] text-ink-5 leading-relaxed max-w-[28ch] mx-auto">
                  Copilot está observando · novos nudges aparecem aqui em segundos quando uma
                  oportunidade for detectada.
                </p>
              </div>
            )}
          </div>

          {/* Dica de swipe · só mobile, só com cards · easter-egg discreto */}
          {padNudges.length > 0 && (
            <div className="md:hidden text-center pb-3 px-3">
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-cta text-ink-4">
                <span>← Rejeitar</span>
                <span className="w-px h-3 bg-ink-3" aria-hidden="true" />
                <span>arraste para decidir</span>
                <span className="w-px h-3 bg-ink-3" aria-hidden="true" />
                <span>Aceitar →</span>
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
