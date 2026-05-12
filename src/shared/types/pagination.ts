/**
 * Paginação genérica · contrato compartilhado.
 * NÃO redefinir por módulo · padrão Eliza/Fourblox.
 */
export interface Paginado<T> {
  itens: T[];
  temMais: boolean;
  limite: number;
  offset: number;
}
