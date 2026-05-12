import { Link } from 'react-router-dom';
import { ShoppingBag, Check } from 'lucide-react';
import type { Product } from '@/types';
import clsx from 'clsx';
import { formatBRL } from '@/utils/format';
import { usePosStore } from '@/store/usePosStore';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { WishlistHeart } from './WishlistHeart';

interface Props {
  product: Product;
  showActions?: boolean;
}

export function ProductCard({ product, showActions = true }: Props) {
  const { addToCart } = usePosStore();
  const tp = useTenantPath();
  const productHref = tp(`/produto/${product.sku}`);

  const tagColor =
    product.tag === 'novo'
      ? 'bg-success text-white'
      : product.tag === 'limitada'
        ? 'bg-coral-500 text-white'
        : 'bg-gold text-white';

  return (
    <article className="card group hover:shadow-hover transition-shadow flex flex-col">
      <div className="relative">
        <Link to={productHref} className="block overflow-hidden bg-ink-1">
          <div className="aspect-square relative">
            <img
              src={product.imageUrl}
              alt={product.imageAlt || product.name}
              loading="lazy"
              className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        </Link>
        <WishlistHeart
          productId={product.id}
          productName={product.name}
          variant="card"
          className="absolute top-2 right-2"
        />
      </div>
      <div className="p-3 md:p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={clsx(
              'text-[10px] uppercase tracking-label font-bold',
              product.brand === 'life' ? 'text-life' : 'text-coral-500',
            )}
          >
            {product.collection || (product.brand === 'life' ? 'Life' : 'Vivara')}
          </span>
          {product.tag && (
            <span className={clsx('tag', tagColor)}>{product.tag}</span>
          )}
        </div>
        <Link to={productHref} className="text-[13px] md:text-[14px] font-medium text-ink-7 leading-snug mb-2 hover:text-coral-500 transition flex-1">
          {product.name}
        </Link>
        <div className="text-[11px] text-ink-5 mb-3 font-mono flex flex-wrap gap-x-3 gap-y-1">
          <span>{product.metal}</span>
          <span>{product.weightG}g</span>
          {product.hasCertificate && (
            <span className="text-success inline-flex items-center gap-1">
              <Check size={11} strokeWidth={3} aria-hidden="true" /> Certificado
            </span>
          )}
        </div>
        <div className="mb-3">
          {product.oldPrice && (
            <span className="text-xs text-ink-5 line-through mr-2">{formatBRL(product.oldPrice)}</span>
          )}
          <span className="text-base md:text-lg font-bold text-ink-7">{formatBRL(product.price)}</span>
        </div>
        <div className="text-[10px] text-ink-5 mb-3 uppercase tracking-cta">
          {product.stockLocal > 0 ? (
            <span className="text-success">{product.stockLocal} em loja</span>
          ) : (
            <span className="text-coral-500">Endless Aisle · {product.stockNetwork} na rede</span>
          )}
        </div>
        {showActions && (
          <button
            type="button"
            onClick={() => addToCart(product)}
            className="btn-primary btn-sm w-full"
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            <ShoppingBag size={14} aria-hidden="true" />
            Adicionar
          </button>
        )}
      </div>
    </article>
  );
}
