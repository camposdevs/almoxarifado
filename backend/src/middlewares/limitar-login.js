import { HttpError } from '../utils/http-error.js';

// Limite simples por IP para dificultar tentativa e erro de senhas (em memória).
export function criarLimitadorLogin({ max = 30, janelaMs = 15 * 60 * 1000 } = {}) {
  const tentativas = new Map();
  return (ctx) => {
    const agora = Date.now();
    const ip = ctx.ip ?? 'desconhecido';
    const registro = tentativas.get(ip);
    if (!registro || registro.expiraEm < agora) {
      tentativas.set(ip, { total: 1, expiraEm: agora + janelaMs });
      return;
    }
    registro.total += 1;
    if (registro.total > max) {
      throw new HttpError(429, 'Muitas tentativas de login. Tente novamente mais tarde.');
    }
  };
}
