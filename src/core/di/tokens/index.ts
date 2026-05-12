import { CoreTokens } from './core.tokens';
import { VendasTokens } from './vendas/vendas.tokens';

/**
 * Agregador de tokens · padrão Eliza/Fourblox (`DiTokens.<flat>` quando útil).
 *
 * Cada módulo novo adiciona UMA linha de import + UMA linha de spread.
 * NÃO editar no meio · apenas append.
 */
export const DiTokens = {
  ...CoreTokens,
  ...VendasTokens,
} as const;

export { CoreTokens, VendasTokens };
