import { Heart } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { addItemToDefaultList, removeItemFromAll } from '@app/store/slices/wishlistSlice';

interface Props {
  productId: string;
  productName: string;
  /** Estilo: "card" ícone na tela do produto, "compact" inline em listas */
  variant?: 'card' | 'compact';
  className?: string;
}

/**
 * EP-03-F3-FE-02 · Botão de coração para wishlist.
 *
 * Adiciona/remove o produto na lista padrão "Favoritos" do cliente ativo.
 * Sem cliente ativo · cai em estado guest e mostra hint para identificar.
 */
export function WishlistHeart({ productId, productName, variant = 'card', className }: Props) {
  const dispatch = useAppDispatch();
  const customer = useAppSelector((s) => s.customer.active);
  const lists = useAppSelector((s) => s.wishlist.lists);

  const inWishlist = customer
    ? lists.some(
        (l) => l.customerId === customer.id && l.items.some((i) => i.productId === productId),
      )
    : false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customer) {
      toast.warning('Identifique a cliente para usar wishlist', {
        description: 'Use o botão "Identificar cliente" no cabeçalho.',
      });
      return;
    }
    if (inWishlist) {
      dispatch(removeItemFromAll({ customerId: customer.id, productId }));
      toast.info(`Removido de favoritos · ${productName}`);
    } else {
      dispatch(addItemToDefaultList({ customerId: customer.id, productId }));
      toast.success(`Adicionado aos favoritos de ${customer.name}`, {
        description: 'Sincroniza com app/web em ~30s.',
      });
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={inWishlist}
        aria-label={inWishlist ? `Remover ${productName} da wishlist` : `Adicionar ${productName} à wishlist`}
        className={clsx(
          'inline-flex items-center gap-1 text-[11px] uppercase tracking-cta font-bold transition min-h-[36px] px-2',
          inWishlist ? 'text-life' : 'text-ink-5 hover:text-life',
          className,
        )}
      >
        <Heart
          size={14}
          aria-hidden="true"
          className={clsx(inWishlist && 'fill-life')}
        />
        {inWishlist ? 'Favorito' : 'Favoritar'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={inWishlist}
      aria-label={inWishlist ? `Remover ${productName} da wishlist` : `Adicionar ${productName} à wishlist`}
      className={clsx(
        'min-w-[44px] min-h-[44px] inline-flex items-center justify-center bg-white/90 border transition',
        inWishlist
          ? 'border-life text-life hover:bg-life hover:text-white'
          : 'border-border text-ink-7 hover:border-life hover:text-life',
        className,
      )}
    >
      <Heart size={18} aria-hidden="true" className={clsx(inWishlist && 'fill-current')} />
    </button>
  );
}
