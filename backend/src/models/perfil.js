// Perfis de usuário e permissões (regra de negócio do enunciado):
//  - OPERADOR: apenas consultar, inserir e atualizar.
//  - ADMIN: consultar, inserir, atualizar e deletar (+ gerenciar usuários).
export const PERFIL = Object.freeze({ ADMIN: 'ADMIN', OPERADOR: 'OPERADOR' });

export const ACAO = Object.freeze({
  CONSULTAR: 'consultar',
  INSERIR: 'inserir',
  ATUALIZAR: 'atualizar',
  DELETAR: 'deletar',
  GERENCIAR_USUARIOS: 'gerenciar_usuarios',
});

const PERMISSOES = {
  [PERFIL.OPERADOR]: [ACAO.CONSULTAR, ACAO.INSERIR, ACAO.ATUALIZAR],
  [PERFIL.ADMIN]: Object.values(ACAO),
};

export function perfilPermite(perfil, acao) {
  return (PERMISSOES[perfil] ?? []).includes(acao);
}
