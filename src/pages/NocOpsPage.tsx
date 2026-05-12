import { useMemo, useState } from 'react';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  CloudOff,
  Wifi,
  Cpu,
  Zap,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { orgConfigs } from '@app/multitenant/orgConfigs';

/**
 * EP-05-F8 · LI-10 Self-Healing PDV + NOC.
 *
 * Painel consolidado das 11 lojas Vivara (multi-tenant) com KPIs operacionais
 * em tempo real, status por estação, alertas em curso e ações de auto-cura.
 *
 * Em produção · backend agrega Datadog + Azure Monitor + custom telemetry.
 */

interface StoreStatus {
  slug: string;
  name: string;
  uf: string;
  status: 'healthy' | 'degraded' | 'offline';
  pdvOnline: number;
  pdvTotal: number;
  fiscalQueue: number;
  tefSuccessRate: number;
  uptimeMinutes: number;
  alerts: { id: string; severity: 'info' | 'warning' | 'critical'; title: string; runbook: string }[];
}

function deterministicStatus(slug: string): StoreStatus {
  const seed = slug.charCodeAt(0) + slug.charCodeAt(slug.length - 1);
  const total = 4 + (seed % 5);
  const fiscalQueue = (seed * 7) % 12;
  const tefRate = 0.92 + ((seed % 7) / 100);
  const offline = seed % 17 === 0;
  const degraded = !offline && (seed % 11 === 0 || fiscalQueue > 8);
  const status: StoreStatus['status'] = offline ? 'offline' : degraded ? 'degraded' : 'healthy';
  const pdvOnline = offline ? 0 : degraded ? Math.max(1, total - 1) : total;
  const alerts: StoreStatus['alerts'] = [];
  if (offline) {
    alerts.push({
      id: `${slug}-net`,
      severity: 'critical',
      title: 'Link primário ISP-A indisponível',
      runbook: 'Self-healing rota para ISP-B em 4G · NFC-e em contingência',
    });
  }
  if (fiscalQueue > 8) {
    alerts.push({
      id: `${slug}-fiscal`,
      severity: 'warning',
      title: `${fiscalQueue} NFC-e na fila aguardando SEFAZ`,
      runbook: 'Worker reprocessa em 60s · escala +1 réplica se >12',
    });
  }
  if (tefRate < 0.95) {
    alerts.push({
      id: `${slug}-tef`,
      severity: 'info',
      title: `TEF Stone com taxa ${(tefRate * 100).toFixed(1)}%`,
      runbook: 'Fallback automático para Cielo · ETA 0s',
    });
  }
  return {
    slug,
    name: '',
    uf: '',
    status,
    pdvOnline,
    pdvTotal: total,
    fiscalQueue,
    tefSuccessRate: tefRate,
    uptimeMinutes: 30 * 24 * 60 - (seed * 11) % 600,
    alerts,
  };
}

const STATUS_LABEL = {
  healthy: 'Saudável',
  degraded: 'Degradada',
  offline: 'Offline',
} as const;

const STATUS_TONE = {
  healthy: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', dot: 'bg-success' },
  degraded: { color: 'text-warning', bg: 'bg-warning-light', border: 'border-warning/40', dot: 'bg-warning' },
  offline: { color: 'text-danger', bg: 'bg-danger/5', border: 'border-danger/30', dot: 'bg-danger' },
} as const;

export function NocOpsPage() {
  const orgs = orgConfigs;
  const stores = useMemo(
    () =>
      orgs.map<StoreStatus>((o) => ({
        ...deterministicStatus(o.slug),
        name: o.name,
        uf: o.uf,
      })),
    [orgs],
  );

  const [filter, setFilter] = useState<'all' | 'healthy' | 'degraded' | 'offline'>('all');
  const visibleStores = filter === 'all' ? stores : stores.filter((s) => s.status === filter);

  const kpis = useMemo(() => {
    const totalPdvs = stores.reduce((sum, s) => sum + s.pdvTotal, 0);
    const onlinePdvs = stores.reduce((sum, s) => sum + s.pdvOnline, 0);
    const fiscalQueue = stores.reduce((sum, s) => sum + s.fiscalQueue, 0);
    const avgTef = stores.reduce((sum, s) => sum + s.tefSuccessRate, 0) / stores.length;
    const offlineStores = stores.filter((s) => s.status === 'offline').length;
    const degradedStores = stores.filter((s) => s.status === 'degraded').length;
    const totalAlerts = stores.reduce((sum, s) => sum + s.alerts.length, 0);
    return { totalPdvs, onlinePdvs, fiscalQueue, avgTef, offlineStores, degradedStores, totalAlerts };
  }, [stores]);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Gerência', to: '/gerencia' }, { label: 'NOC · Self-Healing' }]} />

      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
          LI-10 · NOC + Auto-Cura
        </p>
        <h1 className="heading-serif text-fluid-h1">Operações em tempo real · 11 lojas</h1>
        <p className="text-ink-5 mt-1 text-[14px]">
          Datadog + Azure Monitor · agregação 5s · ações de self-healing automáticas com humano-no-loop.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6" aria-label="Indicadores agregados">
        <KpiCard
          icon={Cpu}
          label="PDVs online"
          value={`${kpis.onlinePdvs}/${kpis.totalPdvs}`}
          tone={kpis.onlinePdvs === kpis.totalPdvs ? 'success' : 'warning'}
        />
        <KpiCard
          icon={ShieldCheck}
          label="Lojas saudáveis"
          value={`${stores.length - kpis.degradedStores - kpis.offlineStores}/${stores.length}`}
          tone="success"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Alertas ativos"
          value={String(kpis.totalAlerts)}
          tone={kpis.totalAlerts === 0 ? 'success' : kpis.totalAlerts > 5 ? 'danger' : 'warning'}
        />
        <KpiCard
          icon={Activity}
          label="NFC-e em fila"
          value={String(kpis.fiscalQueue)}
          tone={kpis.fiscalQueue < 30 ? 'success' : 'warning'}
        />
        <KpiCard
          icon={Zap}
          label="TEF média"
          value={`${(kpis.avgTef * 100).toFixed(1)}%`}
          tone={kpis.avgTef >= 0.95 ? 'success' : 'warning'}
        />
        <KpiCard icon={TrendingUp} label="Uptime 30d" value="99.92%" tone="success" />
      </section>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'healthy', 'degraded', 'offline'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-2 min-h-[36px] text-[11px] uppercase tracking-cta font-bold border transition',
              filter === f
                ? 'bg-ink-7 text-white border-ink-7'
                : 'border-border text-ink-5 hover:border-ink-7 hover:text-ink-7',
            )}
            aria-pressed={filter === f}
          >
            {f === 'all'
              ? `Todas · ${stores.length}`
              : `${STATUS_LABEL[f]} · ${stores.filter((s) => s.status === f).length}`}
          </button>
        ))}
      </div>

      {/* Heat map + cards */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3" aria-label="Status por loja">
        {visibleStores.map((s) => {
          const tone = STATUS_TONE[s.status];
          return (
            <article
              key={s.slug}
              className={clsx('card border-l-4 p-4', tone.border, tone.bg)}
              aria-labelledby={`store-${s.slug}`}
            >
              <header className="flex items-start gap-3 mb-3">
                <span
                  className={clsx('w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0', tone.dot)}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <h3 id={`store-${s.slug}`} className="font-serif text-lg font-semibold text-ink-7">
                    {s.name}
                  </h3>
                  <p className="text-[11px] text-ink-5 uppercase tracking-cta">
                    {s.slug} · {s.uf} · {STATUS_LABEL[s.status]}
                  </p>
                </div>
                <span
                  className={clsx(
                    'px-2 py-1 text-[10px] uppercase tracking-cta font-bold whitespace-nowrap',
                    tone.color,
                  )}
                >
                  {s.status === 'healthy' ? (
                    <>
                      <CheckCircle2 size={11} className="inline mr-1" /> OK
                    </>
                  ) : s.status === 'offline' ? (
                    <>
                      <CloudOff size={11} className="inline mr-1" /> OFF
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={11} className="inline mr-1" /> DEG
                    </>
                  )}
                </span>
              </header>

              <dl className="grid grid-cols-3 gap-2 text-center mb-3">
                <Metric label="PDVs" value={`${s.pdvOnline}/${s.pdvTotal}`} icon={Cpu} />
                <Metric label="Fila NFC-e" value={String(s.fiscalQueue)} icon={Activity} />
                <Metric label="TEF" value={`${(s.tefSuccessRate * 100).toFixed(0)}%`} icon={Zap} />
              </dl>

              {s.alerts.length === 0 ? (
                <p className="text-[11px] text-ink-5 flex items-center gap-1.5">
                  <Wifi size={11} aria-hidden="true" className="text-success" />
                  Sem alertas · todos os links saudáveis
                </p>
              ) : (
                <ul className="space-y-1.5" role="list" aria-label="Alertas ativos">
                  {s.alerts.map((a) => (
                    <li
                      key={a.id}
                      className={clsx(
                        'text-[12px] border-l-2 pl-2 py-1',
                        a.severity === 'critical' && 'border-danger',
                        a.severity === 'warning' && 'border-warning',
                        a.severity === 'info' && 'border-coral-500',
                      )}
                    >
                      <div className="font-medium text-ink-7">{a.title}</div>
                      <div className="text-[10px] uppercase tracking-cta text-ink-4 mt-0.5">
                        Runbook · {a.runbook}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
        {visibleStores.length === 0 && (
          <div className="lg:col-span-2 text-center py-10 text-ink-5 text-[12px]">
            Nenhuma loja no filtro selecionado.
          </div>
        )}
      </section>

      <footer className="mt-6 text-[10px] uppercase tracking-cta text-ink-4 border-t border-border pt-3">
        Self-healing · failover ISP-A → ISP-B em 4G &lt;30s · NFC-e contingência automática · sync DB ao reconectar
      </footer>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'danger';
}) {
  return (
    <div
      className={clsx(
        'card p-3 border-l-4',
        tone === 'success' && 'border-success',
        tone === 'warning' && 'border-warning',
        tone === 'danger' && 'border-danger',
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-cta font-bold text-ink-5">{label}</span>
        <Icon size={14} aria-hidden="true" className="text-ink-4" />
      </div>
      <div className="font-serif text-2xl font-semibold text-ink-7 tabular-nums">{value}</div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Cpu }) {
  return (
    <div className="border border-border-light bg-white px-2 py-1.5">
      <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-cta text-ink-4 mb-0.5">
        <Icon size={10} aria-hidden="true" />
        {label}
      </div>
      <div className="font-mono text-sm font-bold text-ink-7 tabular-nums">{value}</div>
    </div>
  );
}
