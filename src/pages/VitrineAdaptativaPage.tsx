import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Sparkles,
  TrendingUp,
  Activity,
  Users,
  Clock,
  ArrowRight,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { getProductBySku } from '@/data/mocks';
import { vitrineEvents, vitrineKpis, vitrineTopProfiles } from '@/data/extendedMocks';
import { formatPercent } from '@/utils/format';
import type { VitrineEvent } from '@/data/extendedMocks';

/**
 * EP-05-F8 · LI-12 Vitrine Inteligente Adaptativa.
 *
 * Página de operação para o gerente acompanhar a vitrine adaptativa em tempo
 * real. Mostra:
 *   1. KPIs · taxa de captura, latência, confiança do modelo
 *   2. Vitrine LIVE · mockup de ANTES/DEPOIS da troca de destaque
 *   3. Stream de eventos · últimos perfis detectados + peça trocada
 *   4. Ranking de perfis sociodemográficos detectados nas últimas 24h
 *
 * Em produção: dashboard alimentado por evento Kafka (vitrine.adapted.v1)
 * publicado pelo edge device (Jetson Orin) rodando o classificador local.
 *
 * LGPD-by-design: nenhum frame de imagem chega aqui · só embeddings agregados.
 */

const GROUP_LABEL: Record<string, string> = {
  'solo-feminino': 'Solo · feminino',
  'solo-masculino': 'Solo · masculino',
  'casal-jovem': 'Casal jovem',
  'casal-maduro': 'Casal maduro',
  familia: 'Família',
  amigas: 'Grupo de amigas',
};

function relativeMinutes(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.max(1, Math.round(diffMs / 60000));
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return `há ${h}h`;
}

function VitrineCanvas({ event }: { event: VitrineEvent }) {
  const fromProduct = getProductBySku(event.fromSku);
  const toProduct = getProductBySku(event.toSku);
  const [side, setSide] = useState<'from' | 'to'>('from');
  useEffect(() => {
    setSide('from');
    const t = setTimeout(() => setSide('to'), 900);
    return () => clearTimeout(t);
  }, [event.id]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <figure
        className={clsx(
          'relative bg-ink-1 border-2 transition-all duration-500',
          side === 'from'
            ? 'border-ink-3 opacity-100'
            : 'border-border opacity-50',
        )}
      >
        <span className="absolute top-2 left-2 text-[9px] uppercase tracking-cta font-bold bg-ink-7 text-white px-2 py-0.5 rounded">
          Antes
        </span>
        {fromProduct?.imageUrl && (
          <img
            src={fromProduct.imageUrl}
            alt={fromProduct.name}
            className="w-full aspect-[4/5] object-contain p-6"
            loading="lazy"
          />
        )}
        <figcaption className="px-3 py-2 text-[11px] text-ink-6 border-t border-border">
          {fromProduct?.name ?? event.fromSku}
        </figcaption>
      </figure>

      <figure
        className={clsx(
          'relative bg-coral-50 border-2 transition-all duration-500',
          side === 'to'
            ? 'border-coral-500 shadow-md scale-[1.02]'
            : 'border-coral-200 opacity-50',
        )}
        aria-live="polite"
      >
        <span className="absolute top-2 left-2 text-[9px] uppercase tracking-cta font-bold bg-coral-500 text-white px-2 py-0.5 rounded inline-flex items-center gap-1">
          <Sparkles size={10} aria-hidden="true" />
          Depois · Agente IA
        </span>
        {toProduct?.imageUrl && (
          <img
            src={toProduct.imageUrl}
            alt={toProduct.name}
            className="w-full aspect-[4/5] object-contain p-6"
            loading="lazy"
          />
        )}
        <figcaption className="px-3 py-2 text-[11px] text-ink-7 font-medium border-t border-coral-200">
          {toProduct?.name ?? event.toSku}
        </figcaption>
      </figure>
    </div>
  );
}

export function VitrineAdaptativaPage() {
  const [activeEventId, setActiveEventId] = useState(vitrineEvents[0]?.id);
  const activeEvent = useMemo(
    () => vitrineEvents.find((e) => e.id === activeEventId) ?? vitrineEvents[0],
    [activeEventId],
  );

  // Tick do "ao vivo" · simula novo evento a cada 7s rotacionando o destaque
  useEffect(() => {
    const t = setInterval(() => {
      setActiveEventId((prev) => {
        const idx = vitrineEvents.findIndex((e) => e.id === prev);
        const next = vitrineEvents[(idx + 1) % vitrineEvents.length];
        return next.id;
      });
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const upliftPp = (vitrineKpis.captureRateWeekly - vitrineKpis.captureRateBaseline) * 100;
  const upliftPct = vitrineKpis.captureRateBaseline > 0
    ? (upliftPp / (vitrineKpis.captureRateBaseline * 100)) * 100
    : 0;

  return (
    <div className="space-y-8 reveal">
      <Breadcrumb items={[{ label: 'Vitrine Inteligente Adaptativa' }]} />

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2 inline-flex items-center gap-2">
            <Sparkles size={12} aria-hidden="true" />
            EP-05-F8 · LI-12 Living Intelligence
          </div>
          <h1 className="heading-serif text-fluid-h1">
            Vitrine Inteligente <em className="text-coral-500">Adaptativa</em>
          </h1>
          <p className="text-ink-5 mt-2 text-[14px] max-w-2xl">
            O Agente IA (Vitrine Vision) lê o perfil do shopper na rua, troca a peça em destaque em
            tempo real e mede o impacto na taxa de captura. Tudo on-device · LGPD-by-design.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-success/15 text-success">
          <span className="relative flex w-2 h-2" aria-hidden="true">
            <span className="animate-ping absolute inset-0 rounded-full bg-success opacity-60" />
            <span className="relative w-2 h-2 rounded-full bg-success" />
          </span>
          <span className="text-[11px] uppercase tracking-cta font-bold">
            Edge device online · {vitrineKpis.adaptationsPerHour} adapt/h
          </span>
        </div>
      </header>

      {/* KPIs principais */}
      <section
        aria-label="KPIs da vitrine adaptativa"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      >
        <article className="card p-4">
          <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-1 flex items-center gap-1.5">
            <Eye size={11} aria-hidden="true" />
            Captura semanal
          </div>
          <div className="font-serif text-2xl md:text-3xl text-coral-500 font-semibold tabular-nums">
            {formatPercent(vitrineKpis.captureRateWeekly)}
          </div>
          <div className="text-[10px] text-success font-bold uppercase tracking-cta mt-1">
            +{upliftPp.toFixed(1)}pp vs estática
          </div>
        </article>
        <article className="card p-4">
          <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-1 flex items-center gap-1.5">
            <TrendingUp size={11} aria-hidden="true" />
            Uplift relativo
          </div>
          <div className="font-serif text-2xl md:text-3xl text-success font-semibold tabular-nums">
            +{upliftPct.toFixed(0)}%
          </div>
          <div className="text-[10px] text-ink-5 uppercase tracking-cta mt-1">
            vs vitrine estática (controle)
          </div>
        </article>
        <article className="card p-4">
          <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-1 flex items-center gap-1.5">
            <Activity size={11} aria-hidden="true" />
            Conversão sessão
          </div>
          <div className="font-serif text-2xl md:text-3xl text-ink-7 font-semibold tabular-nums">
            {formatPercent(vitrineKpis.sessionConversion)}
          </div>
          <div className="text-[10px] text-ink-5 uppercase tracking-cta mt-1">
            captura → venda em &lt;30min
          </div>
        </article>
        <article className="card p-4">
          <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-1 flex items-center gap-1.5">
            <Clock size={11} aria-hidden="true" />
            Latência troca
          </div>
          <div className="font-serif text-2xl md:text-3xl text-ink-7 font-semibold tabular-nums">
            {vitrineKpis.swapLatencyMs}ms
          </div>
          <div className="text-[10px] text-ink-5 uppercase tracking-cta mt-1">
            confiança modelo {(vitrineKpis.modelConfidence * 100).toFixed(0)}%
          </div>
        </article>
      </section>

      {/* Vitrine LIVE · ANTES/DEPOIS */}
      {activeEvent && (
        <section
          aria-label="Vitrine adaptativa ao vivo"
          className="card p-4 md:p-6"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-1 inline-flex items-center gap-1.5">
                <Camera size={11} aria-hidden="true" />
                Adaptação ao vivo · {relativeMinutes(activeEvent.ts)}
              </div>
              <h2 className="font-serif text-xl md:text-2xl font-semibold text-ink-7 leading-tight">
                Perfil detectado: {GROUP_LABEL[activeEvent.profile.groupKind]} · {activeEvent.profile.ageRange}
              </h2>
              <p className="text-[12px] text-ink-5 mt-1.5 max-w-2xl">
                Dwell de <strong className="text-ink-7">{activeEvent.dwellSec}s</strong> ·
                confiança <strong className="text-ink-7">{(activeEvent.profile.confidence * 100).toFixed(0)}%</strong> ·
                troca de destaque executada em {vitrineKpis.swapLatencyMs}ms.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeEvent.capturedEntry && (
                <span className="tag bg-success/15 text-success">
                  <Users size={10} aria-hidden="true" /> Entrou na loja
                </span>
              )}
              {activeEvent.capturedSale && (
                <span className="tag bg-coral-50 text-coral-500">
                  <Sparkles size={10} aria-hidden="true" /> Venda na sessão
                </span>
              )}
            </div>
          </div>

          <VitrineCanvas event={activeEvent} />

          <div className="mt-4 p-3 bg-coral-50/50 border-l-4 border-coral-500 text-[12px] text-ink-7">
            <strong className="text-coral-500 uppercase tracking-cta text-[10px] mr-2">
              Vitrine Vision:
            </strong>
            {activeEvent.rationale}
          </div>
        </section>
      )}

      {/* Stream de eventos + Top perfis */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-6">
        <div className="card p-4 md:p-5">
          <h2 className="heading-serif text-fluid-h3 mb-3 flex items-center gap-2">
            <Activity size={16} className="text-coral-500" aria-hidden="true" />
            Stream de adaptações · últimos {vitrineEvents.length} eventos
          </h2>
          <ol role="list" className="space-y-2">
            {vitrineEvents.map((e) => {
              const fromP = getProductBySku(e.fromSku);
              const toP = getProductBySku(e.toSku);
              const isActive = e.id === activeEventId;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setActiveEventId(e.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-2 text-left transition-colors',
                      isActive
                        ? 'bg-coral-50 border border-coral-300'
                        : 'border border-transparent hover:bg-ink-1',
                    )}
                    aria-pressed={isActive}
                    aria-label={`Ver evento ${e.id} · ${GROUP_LABEL[e.profile.groupKind]}`}
                  >
                    <span className="text-[10px] font-mono text-ink-5 w-16 flex-shrink-0">
                      {relativeMinutes(e.ts)}
                    </span>
                    <span className="text-[11px] text-ink-7 flex-shrink-0 min-w-[140px]">
                      <strong>{GROUP_LABEL[e.profile.groupKind]}</strong>
                      <span className="text-ink-5"> · {e.profile.ageRange}</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[11px] text-ink-5 truncate hidden md:inline">
                        {fromP?.name?.split('·')[0]?.trim() ?? e.fromSku}
                      </span>
                      <ArrowRight size={11} className="text-coral-500 flex-shrink-0" aria-hidden="true" />
                      <span className="text-[11px] text-ink-7 font-medium truncate">
                        {toP?.name?.split('·')[0]?.trim() ?? e.toSku}
                      </span>
                    </div>
                    {e.capturedSale && (
                      <span className="tag bg-success/15 text-success text-[9px] flex-shrink-0">
                        venda
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-4">
          <article className="card p-4">
            <h3 className="text-[11px] uppercase tracking-label font-bold text-ink-5 mb-2 flex items-center gap-1.5">
              <Users size={11} aria-hidden="true" />
              Top perfis · 24h
            </h3>
            <ul className="space-y-2 text-[12px]" role="list">
              {vitrineTopProfiles.map((p) => (
                <li key={`${p.groupKind}-${p.ageRange}`} className="flex items-center justify-between gap-2">
                  <span className="text-ink-7 min-w-0 truncate">
                    {GROUP_LABEL[p.groupKind]} · {p.ageRange}
                  </span>
                  <span className="font-mono text-ink-5 flex-shrink-0">
                    {p.count} · <strong className="text-coral-500">{formatPercent(p.conversionRate)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card p-4 bg-success/5 border-success/30">
            <h3 className="text-[11px] uppercase tracking-label font-bold text-success mb-2 flex items-center gap-1.5">
              <ShieldCheck size={11} aria-hidden="true" />
              LGPD-by-design
            </h3>
            <p className="text-[11px] text-ink-7 leading-relaxed">
              Nenhuma imagem é armazenada · classificação roda 100% no edge device. Apenas
              embeddings agregados (faixa etária, composição de grupo, dwell-time) saem do
              dispositivo. Nenhum CPF, foto ou dado sensível atravessa a rede.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
