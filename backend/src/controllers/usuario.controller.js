import { lerId, lerPaginacao } from '../utils/validators.js';

export function criarUsuarioController({ usuarioService }) {
  return {
    listar: (ctx) => ({ status: 200, corpo: usuarioService.listar(lerPaginacao(ctx.query)) }),
    criar: async (ctx) => ({ status: 201, corpo: await usuarioService.criar(ctx.corpo) }),
    atualizar: (ctx) => ({
      status: 200,
      corpo: usuarioService.atualizar(lerId(ctx.params.id), ctx.corpo, ctx.usuario),
    }),
    remover: (ctx) => {
      usuarioService.remover(lerId(ctx.params.id), ctx.usuario);
      return { status: 204 };
    },
  };
}
