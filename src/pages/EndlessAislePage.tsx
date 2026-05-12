import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tablet,
  Search,
  GitCompare,
  Plus,
  X,
  Sparkles,
  Truck,
  Globe,
  ShoppingBag,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/Breadcrumb';
import { products } from '@/data/mocks';
import { storesByDistance } from '@/data/extendedMocks';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { usePosStore } from '@/store/usePosStore';
import { formatBRL } from '@/utils/format';
import type { Product } from '@/types';

/**
 * EP-02-F4 · Endless Aisle no mPOS.
 *
 * Catálogo expandido com filtros e modo "comparar até 3" para vendedor
 * apoiar conversa com cliente quando peça não está fisicamente em loja.
 */

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevância' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
  { id: 'stock_desc', label: 'Maior estoque' },
] as const;
type Sort = (typeof SORT_OPTIONS)[number]['id'];

const CATEGORIES = ['todas', 'aneis', 'brincos', 'colares', 'pulseiras', 'pingentes', 'aliancas', 'relogios', 'kids'] as const;

export function EndlessAislePage() {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const { addToCart } = usePosStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('todas');
  const [brand, setBrand] = useState<'all' | 'vivara' | 'life'>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'lt500' | '500_2000' | 'gt2000'>('all');
  const [sort, setSort] = useState<Sort>('relevance');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.collection ?? '').toLowerCase().includes(q),
      );
    }
    if (category !== 'todas') list = list.filter((p) => p.category === category);
    if (brand !== 'all') list = list.filter((p) => p.brand === brand);
    if (priceRange !== 'all') {
      list = list.filter((p) =>
        priceRange === 'lt500'
          ? p.price < 500
          : priceRange === '500_2000'
            ? p.price >= 500 && p.price <= 2000
            : p.price > 2000,
      );
    }
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'stock_desc') list.sort((a, b) => (b.stockNetwork ?? 0) - (a.stockNetwork ?? 0));
    return list;
  }, [search, category, brand, priceRange, sort]);

  const compareProducts = compareIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const toggleCompare = (id: string) => {
    setCompareIds((ids) => {
      if (ids.includes(id)) return ids.filter((i) => i !== id);
      if (ids.length >= 3) {
        toast.warning('Máximo de 3 peças', {
          description: 'Remova uma da comparação antes de adicionar outra.',
        });
        return ids;
      }
      return [...ids, id];
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Atendimento', to: '/' }, { label: 'Catálogo Estendido' }]} />

      <header className="mb-6 flex items-start gap-3">
        <div className="bg-coral-500 text-white w-12 h-12 flex items-center justify-center flex-shrink-0">
          <Tablet size={24} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
            EP-02-F4 · Endless Aisle
          </p>
          <h1 className="heading-serif text-fluid-h1">Catálogo Estendido (mPOS)</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            498 lojas + 3 CDs em busca unificada · compare até 3 peças e ofereça Ship-from-Store quando faltar em estoque local.
          </p>
        </div>
      </header>

      <section className="card p-4 mb-5" aria-label="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Buscar SKU/nome/coleção
            </label>
            <div className="relative">
              <Search
                size={16}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Anel, brinco, RL-LIFE-..."
                className="input pl-9"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'todas' ? 'Todas' : c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Marca
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value as 'all' | 'vivara' | 'life')}
              className="input"
            >
              <option value="all">Todas</option>
              <option value="vivara">Vivara</option>
              <option value="life">Life</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Preço
            </label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as typeof priceRange)}
              className="input"
            >
              <option value="all">Qualquer</option>
              <option value="lt500">&lt; R$ 500</option>
              <option value="500_2000">R$ 500 – 2.000</option>
              <option value="gt2000">&gt; R$ 2.000</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5">
              Ordenar
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="border border-border bg-white px-2 py-1 min-h-[36px] text-[11px] uppercase tracking-cta font-bold text-ink-7 normal-case"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[10px] uppercase tracking-cta text-ink-4 font-bold">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </section>

      <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {filtered.map((p) => {
          const isComparing = compareIds.includes(p.id);
          const totalNetwork = storesByDistance.reduce((sum, s) => sum + s.stockUnits, 0);
          return (
            <li
              key={p.id}
              className={clsx(
                'card flex flex-col overflow-hidden border',
                isComparing && 'border-coral-500 ring-2 ring-coral-200',
              )}
            >
              <div className="aspect-square bg-ink-1 relative overflow-hidden">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles size={32} className="text-ink-3" aria-hidden="true" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => toggleCompare(p.id)}
                  className={clsx(
                    'absolute top-2 right-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[11px] uppercase tracking-cta font-bold transition',
                    isComparing
                      ? 'bg-coral-500 text-white'
                      : 'bg-white/90 text-ink-7 border border-border hover:bg-coral-500 hover:text-white hover:border-coral-500',
                  )}
                  aria-label={isComparing ? 'Remover da comparação' : 'Adicionar à comparação'}
                  aria-pressed={isComparing}
                >
                  {isComparing ? <X size={16} aria-hidden="true" /> : <GitCompare size={16} aria-hidden="true" />}
                </button>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <div className="text-[10px] uppercase tracking-cta font-bold text-ink-5 mb-1">
                  {p.brand} · {p.category}
                </div>
                <div className="font-serif text-base font-semibold text-ink-7 leading-tight mb-1 flex-1">
                  {p.name}
                </div>
                <div className="text-[10px] text-ink-5 flex items-center gap-2 mb-2">
                  <Globe size={10} aria-hidden="true" />
                  {totalNetwork} und. rede
                  <span aria-hidden="true">·</span>
                  <Truck size={10} aria-hidden="true" />
                  SFS 4-24h
                </div>
                <div className="font-serif text-lg font-semibold text-coral-500 mb-2">
                  {formatBRL(p.price)}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate(tp(`/produto/${p.sku}`))}
                    className="btn-tertiary p-0 flex-1 text-[11px]"
                    aria-label={`Ver detalhe ${p.name}`}
                  >
                    Detalhe
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(p);
                      toast.success('Adicionado · prosseguir checkout');
                    }}
                    className="btn-secondary btn-sm flex-1 text-[11px] inline-flex items-center justify-center gap-1"
                  >
                    <Plus size={12} aria-hidden="true" />
                    Carrinho
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {compareProducts.length > 0 && (
        <section
          className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-coral-500 shadow-elevated p-4"
          aria-label={`Comparação de ${compareProducts.length} peças`}
        >
          <div className="container mx-auto">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <h2 className="heading-serif text-fluid-h3 font-semibold inline-flex items-center gap-2">
                <GitCompare size={18} aria-hidden="true" className="text-coral-500" />
                Comparando {compareProducts.length} de 3
              </h2>
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="btn-tertiary inline-flex items-center gap-1 text-[11px]"
              >
                <X size={12} aria-hidden="true" />
                Limpar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {compareProducts.map((p) => (
                <article key={p.id} className="border border-border p-3 flex gap-3">
                  <div className="w-14 h-14 bg-ink-1 flex-shrink-0">
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-cta font-bold text-ink-5 truncate">
                      {p.brand} · {p.metal}
                    </div>
                    <div className="font-serif text-sm font-semibold text-ink-7 truncate">{p.name}</div>
                    <div className="font-mono text-[11px] tabular-nums text-coral-500 font-bold">
                      {formatBRL(p.price)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCompare(p.id)}
                    className="text-ink-4 hover:text-danger min-w-[32px] min-h-[32px] inline-flex items-center justify-center"
                    aria-label={`Remover ${p.name} da comparação`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  compareProducts.forEach((p) => addToCart(p));
                  setCompareIds([]);
                  toast.success(`${compareProducts.length} peças adicionadas ao carrinho`);
                }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ShoppingBag size={14} aria-hidden="true" />
                Adicionar todas
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
