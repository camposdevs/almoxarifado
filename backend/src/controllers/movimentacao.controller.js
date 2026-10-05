import { HttpError } from '../utils/http-error.js';
import { TIPO_MOVIMENTACAO } from '../models/movimentacao.js';
import { lerId, lerIntervaloDatas, lerPaginacao } from '../utils/validators.js';

function lerFiltros(query) {
  const filtros = { ...lerIntervaloDatas(query) };
  if (query.produtoId !== undefined) filtros.produtoId = lerId(query.produtoId, 'produtoId');
  if (query.tipo !== undefined) {
    if (!Object.values(TIPO_MOVIMENTACAO).includes(query.tipo)) {
      throw new HttpError(400, 'O filtro "tipo" deve ser ENTRADA ou SAIDA.');
    }
    filtros.tipo = query.tipo;
  }
  return filtros;
}

export function criarMovimentacaoController({ movimentacaoService }) {
  return {
    listar: (ctx) => ({
      status: 200,
      corpo: movimentacaoService.listar(lerFiltros(ctx.query), lerPaginacao(ctx.query)),
    }),
    entrada: (ctx) => ({ status: 201, corpo: movimentacaoService.registrarEntrada(ctx.corpo, ctx.usuario) }),
    saida: (ctx) => ({ status: 201, corpo: movimentacaoService.registrarSaida(ctx.corpo, ctx.usuario) }),
  };
}
