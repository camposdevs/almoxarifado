import { PERFIL } from '../models/perfil.js';
import { HttpError } from '../utils/http-error.js';
import { gerarHash } from '../utils/password.js';
import { exigirTexto, paginar, validarEmail, validarSenha } from '../utils/validators.js';

function validarPerfil(perfil) {
  if (!Object.values(PERFIL).includes(perfil)) {
    throw new HttpError(400, `Perfil inválido. Use ${Object.values(PERFIL).join(' ou ')}.`);
  }
  return perfil;
}

export function criarUsuarioService({ usuarios, movimentacoes }) {
  return {
    listar(paginacao) {
      const { itens, total } = usuarios.listar(paginacao);
      return paginar(itens, total, paginacao);
    },

    async criar(dados) {
      const nome = exigirTexto(dados.nome, 'nome', { min: 2, max: 100 });
      const email = validarEmail(dados.email);
      const senha = validarSenha(dados.senha);
      const perfil = validarPerfil(dados.perfil);
      if (usuarios.buscarPorEmailComSenha(email)) throw new HttpError(409, 'E-mail já cadastrado.');
      return usuarios.criar({ nome, email, senhaHash: await gerarHash(senha), perfil });
    },

    atualizar(id, dados, usuarioLogado) {
      const existente = usuarios.buscarPorId(id);
      if (!existente) throw new HttpError(404, 'Usuário não encontrado.');
      const nome = exigirTexto(dados.nome, 'nome', { min: 2, max: 100 });
      const perfil = validarPerfil(dados.perfil);
      if (id === usuarioLogado.id && perfil !== existente.perfil) {
        throw new HttpError(409, 'Você não pode alterar o seu próprio perfil.');
      }
      return usuarios.atualizar(id, { nome, perfil });
    },

    remover(id, usuarioLogado) {
      const existente = usuarios.buscarPorId(id);
      if (!existente) throw new HttpError(404, 'Usuário não encontrado.');
      if (id === usuarioLogado.id) throw new HttpError(409, 'Você não pode excluir o próprio usuário.');
      if (existente.perfil === PERFIL.ADMIN && usuarios.contarAdmins() <= 1) {
        throw new HttpError(409, 'Não é possível excluir o único administrador.');
      }
      if (movimentacoes.existePorUsuario(id)) {
        throw new HttpError(409, 'Usuário possui movimentações registradas e não pode ser excluído (rastreabilidade).');
      }
      usuarios.remover(id);
    },
  };
}
