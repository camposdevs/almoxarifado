import { HttpError } from '../utils/http-error.js';
import { verificarToken } from '../utils/jwt.js';

// Exige "Authorization: Bearer <token>". O usuário é recarregado do banco a cada requisição,
// então perfil alterado ou usuário removido têm efeito imediato.
export function criarAutenticar({ usuarios, config }) {
  return (ctx) => {
    const [esquema, token] = (ctx.req.headers.authorization ?? '').split(' ');
    if (esquema !== 'Bearer' || !token) throw new HttpError(401, 'Autenticação necessária.');

    const payload = verificarToken(token, config.jwtSecret);
    if (!payload) throw new HttpError(401, 'Token inválido ou expirado.');

    const usuario = usuarios.buscarPorId(payload.sub);
    if (!usuario) throw new HttpError(401, 'Usuário não encontrado.');
    ctx.usuario = usuario;
  };
}
