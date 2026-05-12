import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Globe, RotateCcw, Phone, ChevronDown } from 'lucide-react';
import { products } from '@/data/mocks';
import { ProductCard } from '@/components/ProductCard';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ProductGridSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import type { Brand, ProductCategory } from '@/types';
import clsx from 'clsx';

const CATEGORIES: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'aneis', label: 'Anéis' },
  { id: 'aliancas', label: 'Alianças' },
  { id: 'colares', label: 'Colares' },
  { id: 'brincos', label: 'Brincos' },
  { id: 'pulseiras', label: 'Pulseiras' },
  { id: 'pingentes', label: 'Pingentes' },
  { id: 'relogios', label: 'Relógios' },
  { id: 'kids', label: 'Kids' },
];

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [brand, setBrand] = useState<Brand | 'all'>('all');
  const [category, setCategory] = useState<ProductCategory | 'all'>(
    (searchParams.get('categoria') as ProductCategory | null) ?? 'all',
  );
  const [showOnlyLocal, setShowOnlyLocal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 320);
    return () => clearTimeout(t);
  }, []);

  const activeFilterCount =
    (brand !== 'all' ? 1 : 0) +
    (category !== 'all' ? 1 : 0) +
    (showOnlyLocal ? 1 : 0);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = query.toLowerCase();
      const matchesQuery = !q || [p.name, p.sku, p.metal, p.collection ?? '', p.stones ?? '']
        .some(v => v.toLowerCase().includes(q));
      const matchesBrand = brand === 'all' || p.brand === brand;
      const matchesCat = category === 'all' || p.category === category;
      const matchesStock = !showOnlyLocal || p.stockLocal > 0;
      return matchesQuery && matchesBrand && matchesCat && matchesStock;
    });
  }, [query, brand, category, showOnlyLocal]);

  const resetFilters = () => {
    setQuery('');
    setBrand('all');
    setCategory('all');
    setShowOnlyLocal(false);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Catálogo' }]} />
      <header>
        <div className="text-[11px] uppercase tracking-label text-coral-500 font-bold mb-2 flex items-center gap-2">
          <Globe size={14} aria-hidden="true" /> Endless Aisle · catálogo infinito
        </div>
        <h1 className="heading-serif text-fluid-h1 mb-2">
          Catálogo <em className="text-coral-500">498 lojas</em>
        </h1>
        <p className="text-ink-5 text-base max-w-2xl">
          Toda a rede Vivara + Life em busca unificada. Você vende mesmo quando o SKU não está nesta loja.
        </p>
      </header>

      <section className="card p-3 md:p-4 space-y-3 md:space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" aria-hidden="true" />
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSearchParams(e.target.value ? { q: e.target.value } : {});
            }}
            placeholder="Buscar por nome, SKU, coleção, metal, pedra..."
            className="input pl-12"
            aria-label="Buscar peça"
            autoFocus
          />
        </div>

        {/* Toggle filtros · só em mobile e tablet portrait */}
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
          className="lg:hidden w-full inline-flex items-center justify-between min-h-[44px] px-4 border border-border bg-ink-1 hover:bg-coral-50 transition text-[11px] uppercase tracking-cta font-bold"
        >
          <span className="inline-flex items-center gap-2">
            <Filter size={14} aria-hidden="true" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-coral-500 text-white px-2 py-0.5 text-[10px] rounded-none">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={clsx('transition-transform', filtersOpen && 'rotate-180')}
          />
        </button>

        <div
          id="catalog-filters"
          className={clsx(
            'space-y-3 md:space-y-4',
            !filtersOpen && 'hidden lg:block',
          )}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={14} className="text-ink-5 hidden lg:block" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-label font-bold text-ink-5">Marca:</span>
            {(['all', 'vivara', 'life'] as const).map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBrand(b)}
                aria-pressed={brand === b}
                className={clsx(
                  'tag transition min-h-[36px] px-3',
                  brand === b
                    ? b === 'life' ? 'bg-life text-white' : b === 'vivara' ? 'bg-coral-500 text-white' : 'bg-ink-7 text-white'
                    : 'tag-outline hover:bg-coral-50',
                )}
              >
                {b === 'all' ? 'Todas' : b === 'vivara' ? 'Vivara' : 'Life'}
              </button>
            ))}
            <label className="lg:ml-auto text-[10px] uppercase tracking-label font-bold text-ink-5 inline-flex items-center gap-2 min-h-[36px] cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyLocal}
                onChange={e => setShowOnlyLocal(e.target.checked)}
                className="w-5 h-5 accent-coral-500"
              />
              Apenas com estoque local
            </label>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={clsx(
                  'tag transition min-h-[36px] px-3',
                  category === c.id ? 'bg-coral-200 text-ink-7' : 'tag-outline hover:bg-coral-50',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-label font-bold text-ink-5">
          {filtered.length} {filtered.length === 1 ? 'peça' : 'peças'} encontrada{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          illustration="search"
          title={query ? `Nada encontrado para "${query}"` : 'Nenhuma peça com estes filtros'}
          description="Use o Endless Aisle para vender qualquer SKU da rede mesmo sem estoque local · ou ligue para a loja parceira mais próxima."
          primaryAction={
            <button onClick={resetFilters} className="btn-primary">
              <RotateCcw size={14} aria-hidden="true" /> Limpar filtros
            </button>
          }
          secondaryAction={
            <button className="btn-secondary">
              <Phone size={14} aria-hidden="true" /> Endless Aisle · ligar para outra loja
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 pdv:grid-cols-5 gap-3 md:gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
