import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ShoppingBag,
  Award,
  Globe,
  MapPin,
  Sparkles,
  Wrench,
  Check,
  Truck,
  Clock,
  Store,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import { getProductBySku, getProductById, products } from '@/data/mocks';
import { storesByDistance } from '@/data/extendedMocks';
import { ProductCard } from '@/components/ProductCard';
import { Breadcrumb } from '@/components/Breadcrumb';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { formatBRL, formatBRLDecimal } from '@/utils/format';

const CATEGORY_LABELS: Record<string, string> = {
  aneis: 'Anéis',
  brincos: 'Brincos',
  colares: 'Colares',
  pulseiras: 'Pulseiras',
  pingentes: 'Pingentes',
  relogios: 'Relógios',
  aliancas: 'Alianças',
  kids: 'Mini Life',
};

export function ProductPage() {
  const { sku } = useParams();
  const navigate = useNavigate();
  const tp = useTenantPath();
  const { addToCart } = usePosStore();
  const product = getProductBySku(sku) || getProductById(sku ?? '');
  const [storesOpen, setStoresOpen] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(50); // EP-02-F1 filtros
  const [showCD, setShowCD] = useState(true);
  const filteredStores = storesByDistance.filter((s) => {
    if (s.type === 'cd') return showCD;
    return s.distanceKm <= radiusKm;
  });

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-5">Peça não encontrada.</p>
        <button onClick={() => navigate(tp('/catalogo'))} className="btn-primary mt-4">Voltar ao catálogo</button>
      </div>
    );
  }

  const recommendations = products
    .filter(p => p.id !== product.id && p.category === product.category && p.brand === product.brand)
    .slice(0, 4);

  const categoryLabel = CATEGORY_LABELS[product.category] ?? 'Catálogo';

  return (
    <div className="space-y-12 reveal">
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: 'Catálogo', to: '/catalogo' },
            { label: categoryLabel, to: `/catalogo?categoria=${product.category}` },
            { label: product.name },
          ]}
        />
        <button
          onClick={() => navigate(-1)}
          className="btn-tertiary self-start p-0"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
        <div className="bg-ink-1 aspect-square overflow-hidden lg:sticky lg:top-[96px]">
          <img
            src={product.imageUrl}
            alt={product.imageAlt || product.name}
            loading="lazy"
            className="w-full h-full object-contain p-4 md:p-6 lg:p-8"
          />
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[11px] uppercase tracking-label font-bold ${
                product.brand === 'life' ? 'text-life' : 'text-coral-500'
              }`}
            >
              {product.collection || (product.brand === 'life' ? 'Life' : 'Vivara')}
            </span>
            {product.tag && (
              <span
                className={
                  product.tag === 'limitada'
                    ? 'tag bg-coral-500 text-white'
                    : product.tag === 'novo'
                      ? 'tag-success'
                      : 'tag-gold'
                }
              >
                {product.tag}
              </span>
            )}
          </div>
          <h1 className="heading-serif text-fluid-h1 mb-4">{product.name}</h1>
          <p className="text-ink-5 text-lg leading-relaxed mb-6">{product.description}</p>

          {/* Atributos joalheria · EP-04-F2 */}
          <section className="border border-border p-4 md:p-5 mb-6">
            <h2 className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-3 flex items-center gap-2">
              <Award size={12} aria-hidden="true" /> Atributos da peça
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-label text-ink-5 font-bold">SKU</dt>
                <dd className="font-mono text-ink-7">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-label text-ink-5 font-bold">Metal</dt>
                <dd className="text-ink-7">{product.metal}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-label text-ink-5 font-bold">Peso</dt>
                <dd className="text-ink-7">{product.weightG} g</dd>
              </div>
              {product.goldKarat && (
                <div>
                  <dt className="text-[10px] uppercase tracking-label text-ink-5 font-bold">Quilatagem</dt>
                  <dd className="text-ink-7">{product.goldKarat}k</dd>
                </div>
              )}
              {product.stones && (
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-label text-ink-5 font-bold">Pedras</dt>
                  <dd className="text-ink-7">{product.stones}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] uppercase tracking-label text-ink-5 font-bold">Certificado</dt>
                <dd className={product.hasCertificate ? 'text-success font-medium inline-flex items-center gap-1' : 'text-ink-5'}>
                  {product.hasCertificate ? (
                    <>
                      <Check size={12} strokeWidth={3} aria-hidden="true" /> IGI · entregue com a peça
                    </>
                  ) : (
                    'Não aplicável'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-label text-ink-5 font-bold">Garantia</dt>
                <dd className="text-ink-7">{product.warranty}</dd>
              </div>
            </dl>
          </section>

          {/* Estoque · EP-02-F1 · Visão local + rede + drill-down por loja */}
          <section className="border border-border mb-6">
            <div className="grid grid-cols-2">
              <div className="p-4 border-r border-border">
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-1 flex items-center gap-1">
                  <MapPin size={11} aria-hidden="true" /> Esta loja
                </div>
                <div
                  className={clsx(
                    'font-serif text-2xl font-semibold',
                    product.stockLocal > 0 ? 'text-success' : 'text-coral-500',
                  )}
                >
                  {product.stockLocal} {product.stockLocal === 1 ? 'unidade' : 'unidades'}
                </div>
              </div>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-1 flex items-center gap-1">
                  <Globe size={11} aria-hidden="true" /> Rede Vivara · Endless Aisle
                </div>
                <div className="font-serif text-2xl font-semibold text-ink-7">
                  {product.stockNetwork} unidades
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStoresOpen((v) => !v)}
              aria-expanded={storesOpen}
              aria-controls="stores-list"
              className="w-full border-t border-border px-4 py-3 flex items-center justify-between text-[11px] uppercase tracking-cta font-bold text-ink-7 hover:bg-ink-1 transition min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <Store size={14} aria-hidden="true" />
                Ver disponibilidade em outras lojas
              </span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={clsx('transition', storesOpen && 'rotate-180')}
              />
            </button>

            {storesOpen && (
              <div id="stores-list" className="border-t border-border">
                <div className="px-4 py-3 bg-ink-1 border-b border-border-light flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-[11px] uppercase tracking-cta font-bold text-ink-5">
                    Raio
                    <select
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="border border-border bg-white px-2 py-1 min-h-[36px] text-[11px] uppercase tracking-cta font-bold text-ink-7 normal-case"
                      aria-label="Filtrar lojas por raio em km"
                    >
                      <option value={5}>5 km</option>
                      <option value={10}>10 km</option>
                      <option value={25}>25 km</option>
                      <option value={50}>50 km</option>
                      <option value={150}>150 km</option>
                      <option value={5000}>Todas</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-[11px] uppercase tracking-cta font-bold text-ink-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCD}
                      onChange={(e) => setShowCD(e.target.checked)}
                      className="w-4 h-4 accent-coral-500"
                      aria-label="Incluir Centros de Distribuição na lista"
                    />
                    Incluir CDs
                  </label>
                  <span className="ml-auto text-[10px] uppercase tracking-cta text-ink-4">
                    {filteredStores.length} resultado{filteredStores.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {filteredStores.length === 0 && (
                  <div className="p-6 text-center text-[12px] text-ink-5">
                    Nenhuma loja com estoque dentro dos filtros · amplie o raio.
                  </div>
                )}
                <ul role="list" className="divide-y divide-border-light">
                  {filteredStores.map((store, idx) => {
                    const stockBadge =
                      store.stockUnits === 0
                        ? 'text-danger'
                        : store.stockUnits <= 2
                          ? 'text-warning'
                          : 'text-success';
                    const isCurrent = idx === 0 && store.distanceKm === 0;
                    const isCD = store.type === 'cd';
                    return (
                      <li key={store.id} className="p-4 flex items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-[180px]">
                          <div className="font-medium text-ink-7 flex items-center gap-2 flex-wrap">
                            {store.name}
                            {isCurrent && (
                              <span className="tag bg-coral-500 text-white">aqui</span>
                            )}
                            {isCD && (
                              <span className="tag bg-ink-7 text-white">CD</span>
                            )}
                          </div>
                          <div className="text-[11px] text-ink-5 flex items-center gap-2 mt-0.5">
                            <MapPin size={10} aria-hidden="true" />
                            {store.city}/{store.uf}
                            {store.distanceKm > 0 && <span>· {store.distanceKm.toFixed(1)} km</span>}
                          </div>
                        </div>
                        <div className={clsx('text-right tabular-nums font-bold text-sm', stockBadge)}>
                          {store.stockUnits} und.
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {store.stockUnits > 0 && !isCurrent && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  toast.success(
                                    `Reservado em ${store.name} · vale por ${store.reserveTimeMinutes} min`,
                                    {
                                      description:
                                        'Cliente recebe SMS com QR code · BOPIS pronto para retirada.',
                                    },
                                  )
                                }
                                className="btn-tertiary p-0 text-[11px]"
                              >
                                <Clock size={11} aria-hidden="true" /> Reservar {store.reserveTimeMinutes}min
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  toast.success('Ship-from-Store agendado', {
                                    description: `${store.name} envia em até ${store.shipFromStoreSlaH}h · frete grátis para Diamond/Gold.`,
                                  })
                                }
                                className="btn-tertiary p-0 text-[11px]"
                              >
                                <Truck size={11} aria-hidden="true" /> Ship-from-Store {store.shipFromStoreSlaH}h
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="bg-ink-1 px-4 py-3 text-[11px] text-ink-5 flex items-start gap-2">
                  <Sparkles size={12} aria-hidden="true" className="text-coral-500 mt-0.5 flex-shrink-0" />
                  <span>
                    LI-03 inventário vivo · estoque atualizado em &lt;30s · SAP S/4HANA Retail + Pricefx · cobertura 498 lojas.
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Preço */}
          <div className="mb-6">
            {product.oldPrice && (
              <span className="text-base text-ink-5 line-through mr-3">{formatBRL(product.oldPrice)}</span>
            )}
            <span className="font-serif text-5xl font-semibold text-ink-7">
              {formatBRL(product.price)}
            </span>
            <p className="text-[12px] text-ink-5 mt-2">
              ou em até <strong>10x</strong> sem juros de {formatBRLDecimal(product.price / 10)} no crediário Vivara
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => { addToCart(product); navigate(tp('/carrinho')); }} className="btn-primary btn-lg flex-1">
              <ShoppingBag size={16} /> Adicionar e finalizar
            </button>
            <button onClick={() => addToCart(product)} className="btn-secondary btn-lg flex-1">
              Adicionar ao carrinho
            </button>
          </div>

          {/* LI cross-sell · EP-05-F1 */}
          <section className="mt-8 bg-coral-50 border border-coral-200 p-5">
            <div className="text-[10px] uppercase tracking-label font-bold text-coral-500 mb-2 flex items-center gap-2">
              <Sparkles size={12} /> Sugestão Copilot · LI-01
            </div>
            <h3 className="font-serif text-xl font-semibold text-ink-7 mb-2">
              Cliente costuma combinar com:
            </h3>
            <p className="text-sm text-ink-6 mb-3">
              {product.category === 'aneis'
                ? 'Brincos pendentes do mesmo metal · margem otimizada · disponível em estoque local.'
                : product.category === 'colares'
                  ? 'Brincos coordenados · presenteação em datas-marco do cliente.'
                  : 'Combinações da mesma coleção · margem ótima e maior AOV.'}
            </p>
            <button onClick={() => navigate(tp('/catalogo'))} className="btn-tertiary p-0">
              Ver sugestões inteiras →
            </button>
          </section>

          {/* OS · EP-04-F1 */}
          <section className="mt-4 border border-border p-5">
            <div className="text-[10px] uppercase tracking-label font-bold text-ink-5 mb-2 flex items-center gap-2">
              <Wrench size={12} /> Ordem de serviço para esta peça
            </div>
            <p className="text-sm text-ink-6 mb-3">
              Reparo · gravação · redimensionamento · polimento. Cotação imediata via LI-07 (Reparo Inteligente).
            </p>
            <button onClick={() => navigate(tp('/os'))} className="btn-secondary btn-sm">
              Abrir OS
            </button>
          </section>
        </div>
      </div>

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="heading-serif text-fluid-h2 mb-4">
            Você também pode <em className="text-coral-500">considerar</em>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {recommendations.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
