import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Heart, Plus, Trash2, ShoppingBag, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Modal } from '@/components/Modal';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { addList, removeItem } from '@app/store/slices/wishlistSlice';
import { products as allProducts } from '@/data/mocks';
import { customers } from '@/data/mocks';
import { useTenantPath } from '@/presentation/hooks/useTenantPath';
import { formatBRL } from '@/utils/format';

/**
 * EP-03-F3-FE-02 · Página de gestão de wishlists do cliente.
 *
 * Listas nomeadas + ações rápidas para vendedor: enviar lookbook,
 * adicionar tudo ao carrinho, remover item.
 */
export function WishlistsPage() {
  const navigate = useNavigate();
  const tp = useTenantPath();
  const dispatch = useAppDispatch();
  const customer = useAppSelector((s) => s.customer.active);
  const lists = useAppSelector((s) =>
    customer ? s.wishlist.lists.filter((l) => l.customerId === customer.id) : [],
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Heart size={48} aria-hidden="true" className="mx-auto text-ink-3 mb-4" />
        <h1 className="heading-serif text-fluid-h2 mb-2">Wishlist precisa de cliente</h1>
        <p className="text-ink-5 mb-6">Identifique a cliente para visualizar e gerenciar listas.</p>
        <button onClick={() => navigate(tp('/'))} className="btn-primary">
          Voltar ao atendimento
        </button>
      </div>
    );
  }

  const buildLookbook = () => {
    toast.success('Lookbook enviado por WhatsApp', {
      description: `${customer.name} recebe deeplink com cada peça pré-aprovada para checkout.`,
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb
        items={[
          { label: 'Atendimento', to: '/' },
          { label: customer.name, to: `/cliente/${customer.id}` },
          { label: 'Wishlists' },
        ]}
      />

      <header className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-life mb-1">
            EP-03-F3 · Listas de desejos
          </p>
          <h1 className="heading-serif text-fluid-h1">Wishlists de {customer.name}</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            {lists.length} lista{lists.length !== 1 ? 's' : ''} · sincronizadas com app/web em tempo real.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <Plus size={14} aria-hidden="true" />
          Nova lista
        </button>
      </header>

      {lists.length === 0 ? (
        <p className="card p-10 text-center text-ink-5">
          Cliente ainda não tem wishlists. Crie uma para começar.
        </p>
      ) : (
        <div className="space-y-5">
          {lists.map((list) => {
            const items = list.items
              .map((it) => ({ ...it, product: allProducts.find((p) => p.id === it.productId) }))
              .filter((it) => it.product);
            const total = items.reduce((s, it) => s + (it.product?.price ?? 0), 0);
            return (
              <article key={list.id} className="card p-4">
                <header className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-ink-7 inline-flex items-center gap-2">
                      <Heart size={18} aria-hidden="true" className="text-life fill-life" />
                      {list.name}
                    </h2>
                    <p className="text-[11px] text-ink-5">
                      {items.length} peça{items.length !== 1 ? 's' : ''} · total {formatBRL(total)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={buildLookbook}
                      className="btn-tertiary inline-flex items-center gap-1 text-[11px]"
                    >
                      <Send size={12} aria-hidden="true" />
                      Enviar lookbook
                    </button>
                  </div>
                </header>
                {items.length === 0 ? (
                  <p className="text-[12px] text-ink-5 italic">Lista vazia. Adicione peças via coração no catálogo.</p>
                ) : (
                  <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((it) =>
                      it.product ? (
                        <li key={it.productId} className="border border-border p-3 flex gap-3">
                          <div className="w-16 h-16 bg-ink-1 flex-shrink-0">
                            {it.product.imageUrl && (
                              <img
                                src={it.product.imageUrl}
                                alt={it.product.name}
                                className="w-full h-full object-contain p-1"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-serif text-[13px] font-semibold text-ink-7 truncate">
                              {it.product.name}
                            </div>
                            <div className="font-mono text-[11px] text-coral-500 font-bold">
                              {formatBRL(it.product.price)}
                            </div>
                            {it.note && (
                              <div className="text-[10px] text-ink-5 italic mt-0.5 truncate">
                                "{it.note}"
                              </div>
                            )}
                            <div className="flex gap-1 mt-1.5">
                              <button
                                type="button"
                                onClick={() => navigate(tp(`/produto/${it.product!.sku}`))}
                                className="text-[10px] uppercase tracking-cta font-bold text-ink-5 hover:text-coral-500 inline-flex items-center gap-0.5"
                              >
                                Ver
                              </button>
                              <span className="text-ink-3">·</span>
                              <button
                                type="button"
                                onClick={() =>
                                  dispatch(
                                    removeItem({ listId: list.id, productId: it.productId }),
                                  )
                                }
                                className="text-[10px] uppercase tracking-cta font-bold text-ink-5 hover:text-danger inline-flex items-center gap-0.5"
                                aria-label={`Remover ${it.product.name} da lista ${list.name}`}
                              >
                                <Trash2 size={9} aria-hidden="true" />
                                Remover
                              </button>
                            </div>
                          </div>
                        </li>
                      ) : null,
                    )}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewName('');
        }}
        size="sm"
        title="Nova lista de desejos"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = newName.trim();
            if (!name) return;
            dispatch(addList({ customerId: customer.id, name }));
            toast.success(`Lista "${name}" criada`);
            setCreateOpen(false);
            setNewName('');
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Nome da lista
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Aniversário 30 anos · Dia das Mães"
              className="input"
              autoFocus
              maxLength={60}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border-light pt-3">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                setNewName('');
              }}
              className="btn-tertiary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={!newName.trim()} className="btn-primary">
              Criar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
