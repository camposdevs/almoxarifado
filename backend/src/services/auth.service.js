import { PERFIL } from '../models/perfil.js';
import { HttpError } from '../utils/http-error.js';
import { assinarToken } from '../utils/jwt.js';
import { conferirSenha, gerarHash } from '../utils/password.js';
import { exigirTexto, validarEmail, validarSenha } from '../utils/validators.js';

export function criarAuthService({ usuarios, config }) {
  // Hash "de mentira" para que o tempo de resposta não revele se o e-mail existe.
  const hashFalso = gerarHash('senha-inexistente-123');

  return {
    // Cadastro público: sempre cria OPERADOR. Administradores só são criados por outro administrador.
    async registrar(dados) {
      const nome = exigirTexto(dados.nome, 'nome', { min: 2, max: 100 });
      const email = validarEmail(dados.email);
      const senha = validarSenha(dados.senha);

      if (usuarios.buscarPorEmailComSenha(email)) throw new HttpError(409, 'E-mail já cadastrado.');
      return usuarios.criar({ nome, email, senhaHash: await gerarHash(senha), perfil: PERFIL.OPERADOR });
    },

    async login(dados) {
      const email = typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : '';
      const senha = typeof dados.senha === 'string' ? dados.senha : '';
      const registro = usuarios.buscarPorEmailComSenha(email);

      const senhaConfere = await conferirSenha(senha, registro ? registro.senhaHash : await hashFalso);
      if (!registro || !senhaConfere) throw new HttpError(401, 'E-mail ou senha inválidos.');

      const token = assinarToken({ sub: registro.id, perfil: registro.perfil }, config.jwtSecret, config.jwtExpiresInSeconds);
      const { senhaHash, ...usuario } = registro;
      return { token, usuario };
    },
  };
}
