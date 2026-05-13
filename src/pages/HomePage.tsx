import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ScanFace,
  IdCard,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { products, customers } from '@/data/mocks';
import { ProductCard } from '@/components/ProductCard';
import { CustomerCard } from '@/components/CustomerCard';
import { RecommendationsCard } from '@/components/RecommendationsCard';
import {
  CustomerQuickScanDialog,
  type ScanInitialPanel,
} from '@/components/CustomerQuickScanDialog';
import { EndAttendanceButton } from '@/components/EndAttendanceButton';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { formatBRL, formatPercent } from '@/utils/format';

export function HomePage() {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const [query, setQuery] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [scanInitialPanel, setScanInitialPanel] = useState<ScanInitialPanel>(null);
  const seller = usePosStore(s => s.seller);
  const activeCustomer = usePosStore(s => s.activeCustomer);
  const recommendedProducts = products.filter(p => p.tag === 'bestseller').slice(0, 4);
  const recentCustomers = customers.slice(0, 4);

  const openScan = (panel: ScanInitialPanel) => {
    setScanInitialPanel(panel);
    setScanOpen(true);
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`${tp('/catalogo')}?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="space-y-12">
      {/* Hero · greeting */}
      <section className="reveal">
        <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2">
          Atendimento ativo · {seller?.storeName}
        </div>
        <h1 className="heading-serif text-fluid-hero mb-4">
          Bom atendimento,<br />
          <em className="text-coral-500">{seller?.name.split(' ')[0]}.</em>
        </h1>
        <p className="text-ink-5 text-lg max-w-2xl">
          Hoje você está atendendo na <strong className="text-ink-7">{seller?.brand === 'vivara' ? 'Vivara' : 'Life'}</strong>.
          O Agente IA está observando e já tem nudges ativos no painel à direita.
        </p>
      </section>

      {/* KPIs do vendedor */}
      <section className="grid grid-cols-2 md:grid-cols-4 border border-border">
        {[
          { label: 'Vendas do mês', value: formatBRL(seller?.monthSales ?? 0), delta: '+12,4% vs ontem' },
          { label: 'AOV', value: formatBRL(seller?.monthAOV ?? 0), delta: 'meta R$ 2.000', highlight: 'coral' },
          { label: 'Conversão', value: formatPercent(seller?.monthConversion ?? 0), delta: '+5pp meta', highlight: 'success' },
          { label: 'Treinamento', value: `${seller?.trainingScore ?? 0}/100`, delta: 'LI-11 ativo', highlight: 'gold' },
        ].map(kpi => (
          <div key={kpi.label} className="p-4 md:p-5 border-r border-b border-border last:border-r-0">
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-2">
              {kpi.label}
            </div>
            <div
              className={`font-serif text-3xl font-semibold leading-none ${
                kpi.highlight === 'coral' ? 'text-coral-500' :
                kpi.highlight === 'success' ? 'text-success' :
                kpi.highlight === 'gold' ? 'text-gold' : 'text-ink-7'
              }`}
            >
              {kpi.value}
            </div>
            <div className="mt-2 text-[11px] text-success font-medium flex items-center gap-1">
              <TrendingUp size={11} />
              {kpi.delta}
            </div>
          </div>
        ))}
      </section>

      {/* Atendimento ativo */}
      {activeCustomer && (
        <section className="bg-coral-50 border border-coral-200 p-6 reveal">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold flex items-center gap-2">
              <Sparkles size={14} /> Atendimento ativo
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate(tp(`/cliente/${activeCustomer.id}`))}
                className="text-[11px] uppercase tracking-cta font-bold text-ink-7 hover:text-coral-500"
              >
                Ver 360 →
              </button>
              <EndAttendanceButton variant="secondary" />
            </div>
          </div>
          <CustomerCard customer={activeCustomer} />
        </section>
      )}

      {/* Identificar cliente · 3 caminhos curados (só sem cliente ativo) */}
      {!activeCustomer && (
        <section
          aria-label="Identificar cliente"
          className="bg-gradient-to-br from-white via-coral-50/60 to-white border-2 border-coral-200 p-5 md:p-6 reveal"
        >
          <header className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2 inline-flex items-center gap-2">
                <Sparkles size={12} aria-hidden="true" />
                Comece a sessão de atendimento
              </div>
              <h2 className="heading-serif text-fluid-h2">
                Identifique <em className="text-coral-500">o cliente</em>
              </h2>
              <p className="text-ink-5 mt-1 text-[13px] max-w-xl">
                Em 1 toque o Agente IA carrega Visão 360°, wishlist, briefing pré-atendimento
                e cross-channel.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-cta font-bold text-success bg-success/10 px-2 py-1">
              <ShieldCheck size={11} aria-hidden="true" />
              LGPD-by-design
            </span>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => openScan('facial')}
              className="group border border-coral-300 bg-white p-4 text-left flex flex-col gap-2 hover:bg-coral-500 hover:text-white transition min-h-[140px]"
              aria-label="Identificar por reconhecimento facial"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 bg-coral-50 group-hover:bg-white/20 text-coral-500 group-hover:text-white">
                <ScanFace size={20} aria-hidden="true" />
              </span>
              <span className="text-[11px] uppercase tracking-cta font-bold text-coral-500 group-hover:text-white">
                Reconhecimento facial
              </span>
              <span className="text-[12px] leading-snug text-ink-6 group-hover:text-white/90">
                Olhe para a câmera · embeddings on-device, opt-in biométrico.
              </span>
            </button>

            <button
              type="button"
              onClick={() => openScan('cpf')}
              className="group border border-coral-300 bg-white p-4 text-left flex flex-col gap-2 hover:bg-coral-500 hover:text-white transition min-h-[140px]"
              aria-label="Identificar por CPF"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 bg-coral-50 group-hover:bg-white/20 text-coral-500 group-hover:text-white">
                <IdCard size={20} aria-hidden="true" />
              </span>
              <span className="text-[11px] uppercase tracking-cta font-bold text-coral-500 group-hover:text-white">
                CPF
              </span>
              <span className="text-[12px] leading-snug text-ink-6 group-hover:text-white/90">
                Validação local + cadastro inline se o cliente ainda não existir.
              </span>
            </button>

            <button
              type="button"
              onClick={() => openScan('search')}
              className="group border border-coral-300 bg-white p-4 text-left flex flex-col gap-2 hover:bg-coral-500 hover:text-white transition min-h-[140px]"
              aria-label="Identificar por QR ou busca livre"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 bg-coral-50 group-hover:bg-white/20 text-coral-500 group-hover:text-white">
                <QrCode size={20} aria-hidden="true" />
              </span>
              <span className="text-[11px] uppercase tracking-cta font-bold text-coral-500 group-hover:text-white">
                QR / Busca
              </span>
              <span className="text-[12px] leading-snug text-ink-6 group-hover:text-white/90">
                QR Code recebido em WhatsApp ou busca por nome / e-mail.
              </span>
            </button>
          </div>
        </section>
      )}

      <CustomerQuickScanDialog
        open={scanOpen}
        initialPanel={scanInitialPanel}
        onClose={() => setScanOpen(false)}
      />

      {/* Quick search · Endless aisle (EP-02-F4) */}
      <section>
        <h2 className="heading-serif text-fluid-h2 mb-4">
          Buscar peça <em className="text-coral-500">em qualquer loja da rede</em>
        </h2>
        <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Anel solitário ouro 18k · BR00047389 · Vivara V"
              className="input pl-12 text-base"
              aria-label="Buscar peça"
            />
          </div>
          <button type="submit" className="btn-primary btn-lg sm:flex-shrink-0">Buscar</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Anéis V', 'Aliança ouro 18k', 'Brincos pendentes', 'Life prata', 'Coleção exclusiva'].map(q => (
            <button
              key={q}
              onClick={() => navigate(`${tp('/catalogo')}?q=${encodeURIComponent(q)}`)}
              className="tag-outline hover:bg-coral-50"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="heading-serif text-fluid-h2">
            Mais vendidas <em className="text-coral-500">desta semana</em>
          </h2>
          <button
                onClick={() => navigate(tp('/catalogo'))}
            className="text-[11px] uppercase tracking-cta font-bold text-ink-7 hover:text-coral-500 inline-flex items-center gap-1 min-h-[44px]"
          >
            Ver catálogo completo <ArrowRight size={12} aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {recommendedProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="reveal">
        <RecommendationsCard />
      </section>

      {/* Clientes recentes */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="heading-serif text-fluid-h2">
            Clientes <em className="text-coral-500">recentes</em>
          </h2>
          <span className="text-[11px] uppercase tracking-label text-ink-5">
            <Calendar size={12} className="inline mr-1" aria-hidden="true" /> Top 4 por LTV
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentCustomers.map(c => (
            <CustomerCard key={c.id} customer={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
