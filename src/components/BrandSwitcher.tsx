import { useState } from 'react';
import { Crown, Sparkles, Store as StoreIcon } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Modal } from './Modal';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { setBrand } from '@app/store/slices/authSlice';
import type { Brand } from '@/types';

/**
 * EP-01-F2 · Multi-marca · seletor explícito de marca/canal.
 *
 * Aplica brand cosmeticamente (Header logo, accent, KPIs, badges) E
 * registra no Redux para hooks/utilitários derivados.
 *
 * Quiosque é um terceiro modo tratado como "Vivara" no domínio mas com
 * layout simplificado (kiosk) controlado em iteração futura.
 */
const BRANDS: { id: Brand | 'kiosk'; label: string; description: string; icon: typeof Crown }[] = [
  {
    id: 'vivara',
    label: 'Vivara',
    description: 'Loja flagship · catálogo completo · clienteling premium',
    icon: Crown,
  },
  {
    id: 'life',
    label: 'Life',
    description: 'Marca jovem · pricing agressivo · ticket médio menor',
    icon: Sparkles,
  },
  {
    id: 'kiosk',
    label: 'Quiosque',
    description: 'Self-service · UI reduzida · pagamento PIX/cartão',
    icon: StoreIcon,
  },
];

export function BrandSwitcher() {
  const [open, setOpen] = useState(false);
  const brand = useAppSelector((s) => s.auth.brand);
  const dispatch = useAppDispatch();

  const handleSelect = (id: Brand | 'kiosk') => {
    if (id === 'kiosk') {
      toast.info('Modo Quiosque · roadmap Fase 2', {
        description: 'UI self-service em homologação · ETA Out/2026',
      });
      setOpen(false);
      return;
    }
    dispatch(setBrand(id));
    toast.success(`Marca ${id === 'life' ? 'Life' : 'Vivara'} ativa`, {
      description: 'Tema, catálogo e KPIs adaptados em tempo real.',
    });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          'hidden md:inline-flex items-center gap-2 px-3 py-2 min-h-[44px] text-[11px] uppercase tracking-cta font-bold border transition',
          brand === 'life'
            ? 'border-life text-life hover:bg-life hover:text-white'
            : 'border-coral-500 text-coral-500 hover:bg-coral-500 hover:text-white',
        )}
        title="Alternar marca · Vivara/Life/Quiosque"
        aria-label="Alternar marca da estação"
      >
        {brand === 'life' ? <Sparkles size={14} aria-hidden="true" /> : <Crown size={14} aria-hidden="true" />}
        <span className="hidden xl:inline">{brand === 'life' ? 'Life' : 'Vivara'}</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title="Selecionar marca da estação"
        description="O layout, catálogo e regras fiscais ajustam à marca escolhida"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BRANDS.map((b) => {
            const Icon = b.icon;
            const active = b.id === brand;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelect(b.id)}
                className={clsx(
                  'border p-4 text-left flex flex-col gap-2 transition min-h-[140px]',
                  active
                    ? 'border-coral-500 bg-coral-50 shadow-hover'
                    : 'border-border hover:border-ink-7 hover:bg-ink-1',
                )}
                aria-pressed={active}
                aria-label={`Selecionar marca ${b.label}`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    size={18}
                    aria-hidden="true"
                    className={
                      b.id === 'life'
                        ? 'text-life'
                        : b.id === 'kiosk'
                          ? 'text-ink-5'
                          : 'text-coral-500'
                    }
                  />
                  <span className="font-serif text-xl font-semibold">{b.label}</span>
                  {active && (
                    <span className="ml-auto text-[10px] uppercase tracking-cta font-bold text-coral-500">
                      ativa
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-ink-5 leading-snug">{b.description}</p>
              </button>
            );
          })}
        </div>
        <div className="text-[10px] text-ink-4 uppercase tracking-cta border-t border-border-light pt-3 mt-4">
          Multi-marca + multi-caixa · EP-01-F2 · pricing rules e fiscal por marca
        </div>
      </Modal>
    </>
  );
}
