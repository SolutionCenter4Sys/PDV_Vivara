/**
 * Erro de negócio retornado pelo backend (sucesso === false no envelope).
 * Disparado pelo RepositoryImpl após unwrap do ApiGenericResult.
 */
export class ApiBusinessError extends Error {
  readonly erros: string[];

  constructor(message: string, erros: string[] = []) {
    super(message);
    this.name = 'ApiBusinessError';
    this.erros = erros;
    Object.setPrototypeOf(this, ApiBusinessError.prototype);
  }
}
