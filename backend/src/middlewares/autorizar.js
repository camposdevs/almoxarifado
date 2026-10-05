import { perfilPermite } from '../models/perfil.js';
import { HttpError } from '../utils/http-error.js';

// Controle por tipo de usuário: libera a rota apenas se o perfil tiver a ação exigida.
export function autorizar(acao) {
  return (ctx) => {
    if (!perfilPermite(ctx.usuario.perfil, acao)) {
      throw new HttpError(403, 'Acesso negado: seu perfil não tem permissão para esta operação.');
    }
  };
}
