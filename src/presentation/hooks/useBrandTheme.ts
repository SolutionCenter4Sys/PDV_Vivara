import { useEffect } from 'react';
import { useAppSelector } from '@app/store/hooks';

/**
 * `useBrandTheme()` · aplica `data-brand` em <html> e CSS vars de acento
 * conforme a marca ativa (Vivara · coral / Life · pink).
 *
 * Padrão Eliza/Fourblox: tema é controlado por atributo HTML, não por classe,
 * para permitir CSS específico via `[data-brand="life"] .acento { ... }`.
 */
export function useBrandTheme() {
  const brand = useAppSelector((s) => s.auth.brand);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-brand', brand);

    const root = document.documentElement;
    if (brand === 'life') {
      root.style.setProperty('--brand-accent', '#e91e63');
      root.style.setProperty('--brand-accent-soft', '#fce4ec');
    } else {
      root.style.setProperty('--brand-accent', '#f08769');
      root.style.setProperty('--brand-accent-soft', '#feede4');
    }
  }, [brand]);

  return brand;
}
