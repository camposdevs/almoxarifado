import { HttpError } from '../utils/http-error.js';
import { lerId, lerIntervaloDatas, lerPaginacao } from '../utils/validators.js';

function lerNome(query) {
  if (query.nome === undefined) return undefined;
  if (query.nome.length > 100) throw new HttpError(400, 'O filtro "nome" deve ter até 100 caracteres.');
  return query.nome;
}

export function criarProdutoController({ produtoService }) {
  return {
    listar: (ctx) => ({
      status: 200,
      corpo: produtoService.listar(
        { nome: lerNome(ctx.query), ...lerIntervaloDatas(ctx.query) },
        lerPaginacao(ctx.query),
      ),
    }),
    buscar: (ctx) => ({ status: 200, corpo: produtoService.buscar(lerId(ctx.params.id)) }),
    criar: (ctx) => ({ status: 201, corpo: produtoService.criar(ctx.corpo, ctx.usuario) }),
    atualizar: (ctx) => ({ status: 200, corpo: produtoService.atualizar(lerId(ctx.params.id), ctx.corpo) }),
    remover: (ctx) => {
      produtoService.remover(lerId(ctx.params.id));
      return { status: 204 };
    },
  };
}
