export function criarAuthController({ authService }) {
  return {
    registrar: async (ctx) => ({ status: 201, corpo: await authService.registrar(ctx.corpo) }),
    login: async (ctx) => ({ status: 200, corpo: await authService.login(ctx.corpo) }),
    me: (ctx) => ({ status: 200, corpo: ctx.usuario }),
  };
}
