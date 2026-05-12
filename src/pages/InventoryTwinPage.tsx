import { useMemo } from 'react';
import {
  MapPin,
  Eye,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Heart,
  Camera,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { products as allProducts } from '@/data/mocks';
import { formatBRL } from '@/utils/format';

/**
 * EP-05-F2 · LI-03 Inventário Vivo (RFID + CV).
 *
 * Digital twin da loja: mapa visual com posições das gôndolas e peças.
 * Computer Vision detecta peças "tried-not-bought" (cliente segurou e devolveu),
 * gerando "near-miss" para vendedor agir.
 *
 * Em produção · Vision Engine TFOD + RFID realtime + WebSocket events.
 */

interface GondolaCell {
  id: string;
  x: number;
  y: number;
  productId: string;
  expectedUnits: number;
  actualUnits: number;
  triedToday: number; // CV count
  lastSeenAt: string;
  heat: number; // 0-100, "warmth" para heat map (atenção do cliente)
}

interface NearMiss {
  id: string;
  productId: string;
  productName: string;
  triedAt: string;
  durationSec: number;
  customerSegment: string;
  reason: string;
  recoveryHint: string;
  imageUrl?: string;
}

const GONDOLAS: GondolaCell[] = allProducts.slice(0, 12).map((p, idx) => ({
  id: `G-${idx + 1}`,
  x: (idx % 4) + 1,
  y: Math.floor(idx / 4) + 1,
  productId: p.id,
  expectedUnits: p.stockLocal,
  actualUnits: Math.max(0, p.stockLocal - ((idx * 3) % 3)),
  triedToday: (idx * 7) % 18,
  lastSeenAt: new Date(Date.now() - 1000 * 60 * (idx * 6)).toISOString(),
  heat: Math.min(100, ((idx * 17) % 100) + 5),
}));

const NEAR_MISSES: NearMiss[] = [
  {
    id: 'NM-001',
    productId: allProducts[0].id,
    productName: allProducts[0].name,
    triedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    durationSec: 142,
    customerSegment: 'Diamond · 35-45 anos',
    reason: 'Hesitou em preço · saiu sem comprar',
    recoveryHint: 'Oferecer crediário 12x sem juros · próxima visita',
    imageUrl: allProducts[0].imageUrl,
  },
  {
    id: 'NM-002',
    productId: allProducts[3].id,
    productName: allProducts[3].name,
    triedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    durationSec: 87,
    customerSegment: 'Gold · 25-35 anos',
    reason: 'Precisava do tamanho 16, só tinha 14 e 18',
    recoveryHint: 'Reservar via Endless Aisle · peça SFS de Iguatemi (4h)',
    imageUrl: allProducts[3].imageUrl,
  },
  {
    id: 'NM-003',
    productId: allProducts[5].id,
    productName: allProducts[5].name,
    triedAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
    durationSec: 68,
    customerSegment: 'Silver · 45-55 anos',
    reason: 'Quis comparar com modelo digital · não viu',
    recoveryHint: 'Mostrar lookbook iPad com todas as variações',
    imageUrl: allProducts[5].imageUrl,
  },
  {
    id: 'NM-004',
    productId: allProducts[7].id,
    productName: allProducts[7].name,
    triedAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    durationSec: 213,
    customerSegment: 'Diamond · 40-50 anos',
    reason: 'Ausência de vendedor · cliente saiu',
    recoveryHint: 'Capacitar +1 vendedor no horário 19h-21h',
    imageUrl: allProducts[7].imageUrl,
  },
];

export function InventoryTwinPage() {
  const ranked = useMemo(() => [...GONDOLAS].sort((a, b) => b.heat - a.heat), []);
  const lowStock = ranked.filter((g) => g.actualUnits === 0 || g.actualUnits < g.expectedUnits);
  const top3 = ranked.slice(0, 3);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Gerência', to: '/gerencia' }, { label: 'LI-03 · Inventário Vivo' }]} />

      <header className="mb-6 flex items-start gap-3">
        <div className="bg-coral-500 text-white w-12 h-12 flex items-center justify-center flex-shrink-0">
          <Eye size={24} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
            EP-05-F2 · Digital Twin
          </p>
          <h1 className="heading-serif text-fluid-h1">Inventário Vivo da Loja</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            Mapa físico com RFID + Computer Vision · "near-miss" indica peças tried-not-bought.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-5">
        {/* Mapa */}
        <section className="card p-4" aria-labelledby="map-h">
          <header className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h2 id="map-h" className="font-serif text-xl font-semibold inline-flex items-center gap-2">
              <MapPin size={18} aria-hidden="true" className="text-coral-500" />
              Mapa Vivara Morumbi · piso térreo
            </h2>
            <span className="text-[10px] uppercase tracking-cta text-ink-4 font-bold">
              {GONDOLAS.length} gôndolas · 6 câmeras · 1.142 tags RFID
            </span>
          </header>

          <div
            className="relative bg-ink-1 border border-border aspect-[5/3] grid grid-cols-4 grid-rows-3 gap-2 p-3"
            role="img"
            aria-label="Mapa da loja com heat map de atenção"
          >
            {GONDOLAS.map((g) => {
              const product = allProducts.find((p) => p.id === g.productId);
              const heatBg =
                g.heat > 70
                  ? 'bg-coral-500/30'
                  : g.heat > 40
                    ? 'bg-coral-500/15'
                    : g.heat > 20
                      ? 'bg-coral-500/5'
                      : 'bg-white';
              const stockDelta = g.expectedUnits - g.actualUnits;
              return (
                <div
                  key={g.id}
                  className={clsx(
                    'border border-border p-2 flex flex-col text-[10px] relative overflow-hidden transition',
                    heatBg,
                    stockDelta > 0 && 'ring-1 ring-warning',
                    g.actualUnits === 0 && 'ring-2 ring-danger',
                  )}
                  title={`${product?.name} · estoque ${g.actualUnits}/${g.expectedUnits} · ${g.triedToday} interações hoje`}
                >
                  <span className="font-mono text-[9px] text-ink-4 absolute top-1 left-1">{g.id}</span>
                  <div className="mt-3 font-medium text-ink-7 truncate text-[10px] leading-tight">
                    {product?.name}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span
                      className={clsx(
                        'font-mono tabular-nums font-bold',
                        g.actualUnits === 0
                          ? 'text-danger'
                          : g.actualUnits < g.expectedUnits
                            ? 'text-warning'
                            : 'text-success',
                      )}
                    >
                      {g.actualUnits}/{g.expectedUnits}
                    </span>
                    <span className="text-coral-500 font-bold inline-flex items-center gap-0.5">
                      <Heart size={9} aria-hidden="true" />
                      {g.triedToday}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-3 text-[10px] uppercase tracking-cta text-ink-5 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 bg-coral-500/30 border border-coral-500/40" aria-hidden="true" />
              Alta atenção
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 bg-coral-500/15 border border-coral-500/40" aria-hidden="true" />
              Média
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 ring-1 ring-warning bg-white" aria-hidden="true" />
              Estoque baixo
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 ring-2 ring-danger bg-white" aria-hidden="true" />
              Sem estoque
            </span>
          </div>
        </section>

        {/* Top 3 + alertas */}
        <aside className="space-y-4">
          <section className="card p-4 border-l-4 border-coral-500">
            <h3 className="font-serif text-lg font-semibold mb-2 inline-flex items-center gap-2">
              <TrendingUp size={16} aria-hidden="true" className="text-coral-500" />
              Top 3 atenção hoje
            </h3>
            <ul className="space-y-2" role="list">
              {top3.map((g, i) => {
                const p = allProducts.find((pp) => pp.id === g.productId);
                return (
                  <li key={g.id} className="flex items-center gap-2 text-[12px]">
                    <span className="font-mono text-coral-500 font-bold w-4">{i + 1}.</span>
                    <span className="flex-1 truncate">{p?.name}</span>
                    <span className="font-mono text-[11px] text-ink-5 inline-flex items-center gap-0.5">
                      <Heart size={10} aria-hidden="true" />
                      {g.triedToday}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {lowStock.length > 0 && (
            <section className="card p-4 border-l-4 border-warning">
              <h3 className="font-serif text-lg font-semibold mb-2 inline-flex items-center gap-2">
                <TrendingDown size={16} aria-hidden="true" className="text-warning" />
                Reposição necessária
              </h3>
              <ul className="space-y-1.5" role="list">
                {lowStock.slice(0, 5).map((g) => {
                  const p = allProducts.find((pp) => pp.id === g.productId);
                  return (
                    <li key={g.id} className="flex items-center gap-2 text-[11px]">
                      <AlertTriangle
                        size={10}
                        aria-hidden="true"
                        className={g.actualUnits === 0 ? 'text-danger' : 'text-warning'}
                      />
                      <span className="flex-1 truncate">{p?.name}</span>
                      <span
                        className={clsx(
                          'font-mono font-bold',
                          g.actualUnits === 0 ? 'text-danger' : 'text-warning',
                        )}
                      >
                        {g.actualUnits}/{g.expectedUnits}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {/* Near-miss feed */}
      <section className="card p-4" aria-labelledby="nm-h">
        <header className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h2 id="nm-h" className="font-serif text-xl font-semibold inline-flex items-center gap-2">
            <Camera size={18} aria-hidden="true" className="text-coral-500" />
            Near-Miss · "tried-not-bought" hoje
          </h2>
          <span className="text-[10px] uppercase tracking-cta text-ink-4 font-bold">
            CV detectou {NEAR_MISSES.length} interações sem conversão
          </span>
        </header>
        <ul role="list" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {NEAR_MISSES.map((nm) => {
            const elapsedMin = Math.round(
              (Date.now() - new Date(nm.triedAt).getTime()) / (1000 * 60),
            );
            return (
              <li key={nm.id} className="border border-border bg-white p-3 flex gap-3">
                <div className="w-16 h-16 bg-ink-1 flex-shrink-0">
                  {nm.imageUrl && (
                    <img
                      src={nm.imageUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-contain p-1"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-[9px] uppercase tracking-cta text-ink-5">
                      {nm.id} · há {elapsedMin}min
                    </span>
                    <span className="tag bg-coral-50 text-coral-500">
                      {Math.floor(nm.durationSec / 60)}m {nm.durationSec % 60}s
                    </span>
                  </div>
                  <div className="font-serif text-[14px] font-semibold text-ink-7 leading-tight">
                    {nm.productName}
                  </div>
                  <div className="text-[11px] text-ink-5 mb-1">{nm.customerSegment}</div>
                  <div className="text-[11px] text-ink-7">
                    <strong>Por quê:</strong> {nm.reason}
                  </div>
                  <div className="text-[11px] text-coral-500 inline-flex items-center gap-1 mt-1">
                    <Sparkles size={10} aria-hidden="true" />
                    {nm.recoveryHint}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="mt-4 text-[10px] uppercase tracking-cta text-ink-4">
        Vision Engine TFOD · 6 câmeras · privacy-first · faces blurred no edge.
      </footer>
    </div>
  );
}
