/**
 * Envelope padrão · Back-do-Front Fourmakers v2
 * Aplicado também no PDV Vivara como contrato unificado para SAP S/4HANA Retail.
 *
 * Unwrap acontece EXCLUSIVAMENTE no RepositoryImpl.
 * Se `sucesso === false` → lança ApiBusinessError(mensagem, erros).
 */
export interface ApiGenericResult<T> {
  sucesso: boolean;
  mensagem: string;
  erros: string[];
  retorno: T;
}
