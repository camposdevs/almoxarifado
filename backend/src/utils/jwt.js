import { createHmac, timingSafeEqual } from 'node:crypto';

const codificar = (valor) => Buffer.from(valor).toString('base64url');
const assinar = (dados, segredo) => createHmac('sha256', segredo).update(dados).digest();

export function assinarToken(payload, segredo, expiraEmSegundos) {
  const agora = Math.floor(Date.now() / 1000);
  const cabecalho = codificar(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const corpo = codificar(JSON.stringify({ ...payload, iat: agora, exp: agora + expiraEmSegundos }));
  const assinatura = assinar(`${cabecalho}.${corpo}`, segredo).toString('base64url');
  return `${cabecalho}.${corpo}.${assinatura}`;
}

// Retorna o payload se o token for íntegro e não estiver expirado; caso contrário, null.
export function verificarToken(token, segredo) {
  const partes = String(token).split('.');
  if (partes.length !== 3) return null;
  const [cabecalho, corpo, assinatura] = partes;

  const esperada = assinar(`${cabecalho}.${corpo}`, segredo);
  const recebida = Buffer.from(assinatura, 'base64url');
  if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return null;

  try {
    if (JSON.parse(Buffer.from(cabecalho, 'base64url')).alg !== 'HS256') return null;
    const payload = JSON.parse(Buffer.from(corpo, 'base64url'));
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
