import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TrendingUp, AlertTriangle, Activity, Sparkles, Package, ShoppingBag, Users, Check } from 'lucide-react';
import { sellers, customers, orders } from '@/data/mocks';
import { formatBRL, formatPercent } from '@/utils/format';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DashboardKPISkeleton, Skeleton } from '@/components/Skeleton';

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(t);
  }, []);

  // KPI agregados (mock)
  const totalSales = sellers.reduce((sum, s) => sum + s.monthSales, 0);
  const avgAOV = sellers.reduce((sum, s) => sum + s.monthAOV, 0) / sellers.length;
  const avgConv = sellers.reduce((sum, s) => sum + s.monthConversion, 0) / sellers.length;

  if (loading) {
    return (
      <div className="space-y-8 reveal">
        <Breadcrumb items={[{ label: 'Painel' }]} />
        <div className="space-y-2">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <DashboardKPISkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 reveal">
      <Breadcrumb items={[{ label: 'Painel' }]} />
      <header>
        <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2">
          Painel · gerente · 5 lojas Onda 1
        </div>
        <h1 className="heading-serif text-fluid-h1">
          Visão geral <em className="text-coral-500">multi-loja</em>
        </h1>
        <p className="text-ink-5 text-base mt-2 max-w-2xl">
          Consolidação de vendas, conversão, NOC LI-10, anti-fraude LI-04 e Living Intelligence em tempo real.
        </p>
      </header>

      {/* Top KPIs · em tablet portrait usa 2 cols (5 KPIs em 3+2 ficaria assimétrico),
           em tablet landscape 5 cols (≈205px cada · ok no PDV touch) */}
      <section className="grid grid-cols-2 lg:grid-cols-5 border border-border">
        {[
          { label: 'Vendas (mês)', value: formatBRL(totalSales), delta: '+18,4% vs mês anterior', icon: ShoppingBag },
          { label: 'AOV', value: formatBRL(avgAOV), delta: '+R$ 220 vs Q1', icon: TrendingUp, highlight: 'coral' },
          { label: 'Conversão', value: formatPercent(avgConv), delta: '+5,2pp meta', icon: TrendingUp, highlight: 'success' },
          { label: 'NPS Diamond', value: '74', delta: '+12 pts', icon: Users, highlight: 'gold' },
          { label: 'Uptime PDV', value: '99,98%', delta: 'NOC LI-10', icon: Activity, highlight: 'success' },
        ].map(kpi => (
          <div key={kpi.label} className="p-4 md:p-5 border-r border-b border-border last:border-r-0">
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-2 flex items-center gap-1">
              <kpi.icon size={12} aria-hidden="true" /> {kpi.label}
            </div>
            <div
              className={clsx(
                'font-serif text-2xl lg:text-3xl font-semibold leading-tight',
                kpi.highlight === 'coral' ? 'text-coral-500' :
                kpi.highlight === 'success' ? 'text-success' :
                kpi.highlight === 'gold' ? 'text-gold' : 'text-ink-7'
              )}
            >
              {kpi.value}
            </div>
            <div className="mt-2 text-[11px] text-success font-medium flex items-center gap-1">
              <TrendingUp size={11} aria-hidden="true" />
              {kpi.delta}
            </div>
          </div>
        ))}
      </section>

      {/* Loja por loja */}
      <section>
        <h2 className="heading-serif text-fluid-h2 mb-3">Performance por loja</h2>
        <div className="relative">
          <div
            className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white pointer-events-none lg:hidden"
            aria-hidden="true"
          />
          <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-ink-1">
                <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Loja · Vendedor</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Marca</th>
                <th className="text-right p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Vendas (mês)</th>
                <th className="text-right p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">AOV</th>
                <th className="text-right p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Conversão</th>
                <th className="text-right p-3 text-[10px] uppercase tracking-label font-bold border-b-2 border-ink-7">Treinamento LI-11</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(s => (
                <tr key={s.id} className="border-b border-border-light hover:bg-coral-50">
                  <td className="p-3">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-[11px] text-ink-5">{s.storeName}</div>
                  </td>
                  <td className="p-3">
                    <span className={clsx('tag', s.brand === 'life' ? 'bg-life text-white' : 'bg-coral-200 text-ink-7')}>
                      {s.brand.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold">{formatBRL(s.monthSales)}</td>
                  <td className="p-3 text-right">{formatBRL(s.monthAOV)}</td>
                  <td className="p-3 text-right">{formatPercent(s.monthConversion)}</td>
                  <td className="p-3 text-right">
                    <span className={clsx(
                      'font-bold',
                      s.trainingScore >= 90 ? 'text-success' : s.trainingScore >= 80 ? 'text-coral-500' : 'text-warning'
                    )}>
                      {s.trainingScore}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {/* NOC + Living Intelligence · 2col só a partir de tablet landscape */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-ink-7 text-white p-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-label text-coral-200 font-bold mb-3">
            <Activity size={12} /> NOC FourSYS · LI-10 Self-Healing
          </div>
          <h3 className="font-serif text-2xl mb-3">Sistema previu 3 falhas hoje</h3>
          <ul className="text-sm text-white/80 space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <Check size={14} strokeWidth={3} className="text-coral-200 mt-0.5 flex-shrink-0" />
              <span>Loja JK · estação 3 · pinpad TEF · prevenido em 8 min · resolvido auto</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={14} strokeWidth={3} className="text-coral-200 mt-0.5 flex-shrink-0" />
              <span>Loja Iguatemi · drift de RAM · failover sem downtime</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={14} strokeWidth={3} className="text-coral-200 mt-0.5 flex-shrink-0" />
              <span>Loja Barra · queda 4G · modo offline ativado · 12 min · sync OK</span>
            </li>
          </ul>
          <button
            type="button"
            onClick={() =>
              toast.info('Painel NOC pt-BR · Fase 2', {
                description:
                  'Disponível com 498 lojas conectadas + Datadog + Dynatrace Davis. Roadmap WSJF · Fase 2.',
              })
            }
            className="btn-primary"
          >
            Abrir NOC pt-BR
          </button>
        </div>

        <div className="bg-coral-50 border border-coral-200 p-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-label text-coral-500 font-bold mb-3">
            <Sparkles size={12} /> Living Intelligence · LI-04 Anti-fraude
          </div>
          <h3 className="font-serif text-2xl mb-3">Score médio 0.91 · 0 fraudes confirmadas</h3>
          <ul className="text-sm text-ink-6 space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 bg-coral-500 mt-2 flex-shrink-0" aria-hidden="true" />
              <span>142 transações analisadas hoje · {orders.length} aprovadas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 bg-coral-500 mt-2 flex-shrink-0" aria-hidden="true" />
              <span>2 borderlines escalados para gerente · ambos aprovados</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={14} strokeWidth={3} className="text-success mt-0.5 flex-shrink-0" />
              <span>Latência média 142ms · meta &lt; 200ms</span>
            </li>
          </ul>
          <button
            type="button"
            onClick={() =>
              toast.info('Painel Anti-fraude · Fase 2', {
                description:
                  'Featurespace ARIC + modelo Vivara · trail SAP GRC. Disponível na Fase 2 do roadmap.',
              })
            }
            className="btn-secondary"
          >
            Ver detalhes
          </button>
        </div>
      </section>

      {/* Estoque vivo (LI-03) */}
      <section className="card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="heading-serif text-fluid-h2 flex items-center gap-3">
            <Package size={24} aria-hidden="true" /> Estoque vivo · <em className="text-coral-500">LI-03</em>
          </h2>
          <span className="text-[10px] uppercase tracking-label text-ink-5 font-bold">
            RFID Impinj · CV NVIDIA · Edge LGPD
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Peças tagged', value: '23.458', sub: '99,5% cobertura' },
            { label: 'Tried-not-bought hoje', value: '38', sub: '→ remarketing WhatsApp 24h' },
            { label: 'Discrepâncias', value: '2', sub: 'investigação NOC' },
            { label: 'Inventário cíclico', value: '47 min', sub: 'vs 4 dias antes' },
          ].map(stat => (
            <div key={stat.label} className="p-4 bg-coral-50">
              <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-1">{stat.label}</div>
              <div className="font-serif text-2xl font-semibold text-ink-7">{stat.value}</div>
              <div className="text-[11px] text-ink-5 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Alertas */}
      <section>
        <h2 className="heading-serif text-fluid-h2 mb-3 flex items-center gap-3">
          <AlertTriangle size={24} className="text-warning" aria-hidden="true" />
          Alertas · próximas <em className="text-coral-500">ações</em>
        </h2>
        <div className="space-y-3">
          {[
            { type: 'warning', title: '12 clientes Diamond sem contato há 30+ dias', cta: 'Disparar campanha LI-05' },
            { type: 'success', title: 'Coleção V atingiu meta semanal +27% acima', cta: 'Replicar tática' },
            { type: 'info', title: 'Vendedor Renata · meta de treinamento LI-11 hoje', cta: 'Ver trilha' },
          ].map((a, i) => (
            <div key={i} className={clsx(
              'card p-4 flex items-center justify-between gap-3 flex-wrap',
              a.type === 'warning' && 'border-warning bg-warning/5',
              a.type === 'success' && 'border-success bg-success/5',
              a.type === 'info' && 'border-coral-200 bg-coral-50',
            )}>
              <div className="text-sm font-medium text-ink-7">{a.title}</div>
              <button className="btn-secondary btn-sm">{a.cta}</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
