import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ScanLine,
  Tablet,
  Play,
  Pause,
  Square,
  CheckCircle2,
  AlertTriangle,
  Search,
  TrendingDown,
  Layers,
  Wifi,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { products as allProducts } from '@/data/mocks';
import { formatBRL } from '@/utils/format';

/**
 * EP-04-F4 · RFID + Inventário Cíclico (iPad app).
 *
 * Fluxo:
 *   1. Vendedor inicia scan (modo wand RFID)
 *   2. Tags são "lidas" em ráfaga (mock progressivo a cada 250ms)
 *   3. UI mostra diferencial real-time vs estoque sistêmico
 *   4. Lista "Discrepâncias" agrupa missing/extra para investigação
 *
 * Em produção · API Zebra RFID SDK + websocket events.
 */

type ItemStatus = 'matched' | 'missing' | 'extra';

interface InventoryItem {
  sku: string;
  productName: string;
  expected: number;
  scanned: number;
  unitPrice: number;
  status: ItemStatus;
}

function buildInitialInventory(): InventoryItem[] {
  return allProducts.slice(0, 18).map((p) => ({
    sku: p.sku,
    productName: p.name,
    expected: p.stockLocal,
    scanned: 0,
    unitPrice: p.price,
    status: 'missing',
  }));
}

export function RfidInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(() => buildInitialInventory());
  const [running, setRunning] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'matched' | 'missing' | 'extra'>('all');

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setItems((prev) => {
        const pending = prev.filter((i) => i.scanned < i.expected);
        if (pending.length === 0) {
          // Eventualmente "encontra" peças extras (5% chance)
          const extras = Math.random();
          if (extras > 0.95) {
            const idx = Math.floor(Math.random() * prev.length);
            return prev.map((it, i) =>
              i === idx
                ? { ...it, scanned: it.scanned + 1, status: 'extra' as ItemStatus }
                : it,
            );
          }
          return prev;
        }
        const target = pending[Math.floor(Math.random() * pending.length)];
        return prev.map((it) => {
          if (it.sku !== target.sku) return it;
          const newScanned = it.scanned + 1;
          const status: ItemStatus =
            newScanned === it.expected ? 'matched' : newScanned > it.expected ? 'extra' : 'missing';
          return { ...it, scanned: newScanned, status };
        });
      });
    }, 250);
    return () => clearInterval(interval);
  }, [running]);

  const summary = useMemo(() => {
    const matched = items.filter((i) => i.status === 'matched').length;
    const missingItems = items.filter((i) => i.status === 'missing');
    const extras = items.filter((i) => i.status === 'extra').length;
    const expectedTotal = items.reduce((s, i) => s + i.expected, 0);
    const scannedTotal = items.reduce((s, i) => s + i.scanned, 0);
    const missingValue = missingItems.reduce(
      (s, i) => s + (i.expected - i.scanned) * i.unitPrice,
      0,
    );
    const progress = expectedTotal > 0 ? (scannedTotal / expectedTotal) * 100 : 0;
    return { matched, missing: missingItems.length, extras, scannedTotal, expectedTotal, missingValue, progress };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== 'all') list = list.filter((i) => i.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.sku.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, filter, search]);

  const handleStart = () => {
    setRunning(true);
    toast.info('RFID Wand iniciado', {
      description: 'Aproximando da gôndola · leitura ~30 tags/s',
    });
  };
  const handlePause = () => setRunning(false);
  const handleStop = () => {
    setRunning(false);
    toast.success('Inventário concluído', {
      description: `${summary.matched} OK · ${summary.missing} faltando · ${summary.extras} extras`,
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Gerência', to: '/gerencia' }, { label: 'Inventário RFID' }]} />

      <header className="mb-6 flex items-start gap-3">
        <div className="bg-ink-7 text-white w-12 h-12 flex items-center justify-center flex-shrink-0">
          <Tablet size={24} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
            EP-04-F4 · iPad RFID Wand
          </p>
          <h1 className="heading-serif text-fluid-h1">Inventário Cíclico</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            Leitura RFID em massa · validação contra estoque sistêmico SAP em tempo real.
          </p>
        </div>
      </header>

      {/* Painel de controle */}
      <section
        className={clsx(
          'card p-4 mb-5 border-l-4',
          running ? 'border-success animate-pulse-coral' : 'border-ink-3',
        )}
        aria-label="Controle de scan"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'w-12 h-12 flex items-center justify-center text-white',
                running ? 'bg-success' : 'bg-ink-5',
              )}
            >
              <ScanLine size={24} aria-hidden="true" />
            </div>
            <div>
              <div className="font-serif text-xl font-semibold text-ink-7">
                Status: {running ? 'Lendo...' : 'Parado'}
              </div>
              <div className="text-[11px] text-ink-5 inline-flex items-center gap-2">
                <Wifi size={10} aria-hidden="true" className={running ? 'text-success' : ''} />
                Zebra RFD8500 · 902-928 MHz
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!running ? (
              <button
                type="button"
                onClick={handleStart}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Play size={14} aria-hidden="true" />
                Iniciar leitura
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Pause size={14} aria-hidden="true" />
                Pausar
              </button>
            )}
            <button
              type="button"
              onClick={handleStop}
              className="btn-tertiary inline-flex items-center gap-2"
            >
              <Square size={14} aria-hidden="true" />
              Encerrar
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-[10px] uppercase tracking-cta text-ink-5 mb-1">
            <span>Progresso</span>
            <span aria-live="polite" className="font-mono">
              {summary.scannedTotal}/{summary.expectedTotal} tags · {summary.progress.toFixed(0)}%
            </span>
          </div>
          <div
            className="h-2 bg-ink-2 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={summary.progress}
          >
            <div
              className="h-full bg-success transition-all"
              style={{ width: `${summary.progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Kpi
          icon={CheckCircle2}
          label="OK"
          value={String(summary.matched)}
          tone="success"
        />
        <Kpi
          icon={AlertTriangle}
          label="Faltando"
          value={String(summary.missing)}
          tone="danger"
        />
        <Kpi icon={Layers} label="Extras" value={String(summary.extras)} tone="warning" />
        <Kpi
          icon={TrendingDown}
          label="Em risco"
          value={formatBRL(summary.missingValue)}
          tone="danger"
        />
      </section>

      {/* Filtros */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {(['all', 'missing', 'matched', 'extra'] as const).map((f) => (
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
              ? `Todas · ${items.length}`
              : f === 'matched'
                ? `OK · ${summary.matched}`
                : f === 'missing'
                  ? `Faltando · ${summary.missing}`
                  : `Extras · ${summary.extras}`}
          </button>
        ))}
        <div className="flex-1 max-w-xs ml-auto">
          <div className="relative">
            <Search
              size={14}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar SKU ou nome..."
              className="input pl-8 text-[12px]"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[12px]" role="table">
          <caption className="sr-only">Inventário diferencial</caption>
          <thead>
            <tr className="bg-ink-1 text-left">
              <th className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5">SKU</th>
              <th className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5">Peça</th>
              <th className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5 text-right">
                Esperado
              </th>
              <th className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5 text-right">
                Lido
              </th>
              <th className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5 text-right">
                Δ
              </th>
              <th className="px-3 py-2 text-[10px] uppercase tracking-cta text-ink-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => {
              const delta = it.scanned - it.expected;
              return (
                <tr
                  key={it.sku}
                  className={clsx(
                    'border-t border-border-light',
                    it.status === 'missing' && delta < 0 && 'bg-danger/5',
                    it.status === 'extra' && 'bg-warning-light',
                    it.status === 'matched' && 'bg-success/5',
                  )}
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-ink-7">{it.sku}</td>
                  <td className="px-3 py-2 truncate max-w-[300px]">{it.productName}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{it.expected}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{it.scanned}</td>
                  <td
                    className={clsx(
                      'px-3 py-2 text-right font-mono tabular-nums font-bold',
                      delta < 0 && 'text-danger',
                      delta > 0 && 'text-warning',
                    )}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={clsx(
                        'tag',
                        it.status === 'matched' && 'bg-success text-white',
                        it.status === 'missing' && 'bg-danger text-white',
                        it.status === 'extra' && 'bg-warning text-white',
                      )}
                    >
                      {it.status === 'matched'
                        ? 'OK'
                        : it.status === 'missing'
                          ? 'faltando'
                          : 'extra'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-ink-5 text-[13px]">
                  Sem itens no filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-4 text-[10px] uppercase tracking-cta text-ink-4">
        Auditoria fiscal · cada leitura RFID gera evento `inventory.scan` no SAP S/4HANA.
      </footer>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
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
