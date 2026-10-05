import http from 'node:http';
import { criarContainer } from './container.js';
import { criarRotas } from './routes/index.js';
import { HttpError } from './utils/http-error.js';

const LIMITE_CORPO_BYTES = 100 * 1024;

async function lerCorpo(req) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return {};
  const pedacos = [];
  let tamanho = 0;
  for await (const pedaco of req) {
    tamanho += pedaco.length;
    if (tamanho > LIMITE_CORPO_BYTES) throw new HttpError(413, 'Corpo da requisição muito grande.');
    pedacos.push(pedaco);
  }
  if (tamanho === 0) return {};
  if (!String(req.headers['content-type'] ?? '').includes('application/json')) {
    throw new HttpError(415, 'Envie o corpo com Content-Type: application/json.');
  }
  try {
    const corpo = JSON.parse(Buffer.concat(pedacos).toString('utf8'));
    if (corpo === null || typeof corpo !== 'object' || Array.isArray(corpo)) throw new Error();
    return corpo;
  } catch {
    throw new HttpError(400, 'JSON inválido.');
  }
}

function definirCabecalhos(res, config) {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
}

function responder(res, status, corpo) {
  if (corpo === undefined) {
    res.writeHead(status);
    return res.end();
  }
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  return res.end(JSON.stringify(corpo));
}

export function criarApp({ db, config }) {
  const router = criarRotas(criarContainer(db, config));

  return http.createServer(async (req, res) => {
    definirCabecalhos(res, config);
    try {
      if (req.method === 'OPTIONS') return responder(res, 204);

      const url = new URL(req.url, 'http://localhost');
      const rota = router.resolver(req.method, url.pathname);
      if (rota.naoEncontrada) throw new HttpError(404, 'Rota não encontrada.');
      if (rota.metodoNaoPermitido) throw new HttpError(405, 'Método não permitido.');

      const ctx = {
        req,
        ip: req.socket.remoteAddress,
        params: rota.params,
        query: Object.fromEntries(url.searchParams),
        corpo: await lerCorpo(req),
        usuario: null,
      };

      // Cadeia: middlewares (autenticar, autorizar...) seguidos do controller; o primeiro que retornar responde.
      for (const handler of rota.handlers) {
        const resultado = await handler(ctx);
        if (resultado !== undefined) return responder(res, resultado.status, resultado.corpo);
      }
      return responder(res, 500, { erro: 'Rota sem resposta.' });
    } catch (erro) {
      if (erro instanceof HttpError) return responder(res, erro.status, { erro: erro.message });
      console.error('Erro inesperado:', erro);
      return responder(res, 500, { erro: 'Erro interno do servidor.' });
    }
  });
}
