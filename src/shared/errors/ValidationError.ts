/**
 * Erro de validação local (antes de bater no backend).
 * Ex.: union discriminada inválida (chatId vs canal+identidadeCanal).
 */
export class ValidationError extends Error {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
