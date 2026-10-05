export class HttpError extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.name = 'HttpError';
    this.status = status;
  }
}
