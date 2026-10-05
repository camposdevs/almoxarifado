import { Router } from '../core/router.js';
import { autorizar } from '../middlewares/autorizar.js';
import { ACAO } from '../models/perfil.js';

// Todas as rotas, exceto /auth/login, /auth/register e /saude, exigem autenticação.
// A permissão por tipo de usuário é declarada rota a rota.
export function criarRotas({ controllers, middlewares }) {
  const { autenticar, limitarLogin } = middlewares;
  const { auth, usuarios, produtos, movimentacoes } = controllers;
  const router = new Router();

  router.get('/saude', () => ({ status: 200, corpo: { status: 'ok' } }));

  router.post('/auth/register', limitarLogin, auth.registrar);
  router.post('/auth/login', limitarLogin, auth.login);
  router.get('/auth/me', autenticar, auth.me);

  router.get('/produtos', autenticar, autorizar(ACAO.CONSULTAR), produtos.listar);
  router.get('/produtos/:id', autenticar, autorizar(ACAO.CONSULTAR), produtos.buscar);
  router.post('/produtos', autenticar, autorizar(ACAO.INSERIR), produtos.criar);
  router.put('/produtos/:id', autenticar, autorizar(ACAO.ATUALIZAR), produtos.atualizar);
  router.delete('/produtos/:id', autenticar, autorizar(ACAO.DELETAR), produtos.remover);

  router.get('/movimentacoes', autenticar, autorizar(ACAO.CONSULTAR), movimentacoes.listar);
  router.post('/movimentacoes/entrada', autenticar, autorizar(ACAO.INSERIR), movimentacoes.entrada);
  router.post('/movimentacoes/saida', autenticar, autorizar(ACAO.INSERIR), movimentacoes.saida);

  router.get('/usuarios', autenticar, autorizar(ACAO.GERENCIAR_USUARIOS), usuarios.listar);
  router.post('/usuarios', autenticar, autorizar(ACAO.GERENCIAR_USUARIOS), usuarios.criar);
  router.put('/usuarios/:id', autenticar, autorizar(ACAO.GERENCIAR_USUARIOS), usuarios.atualizar);
  router.delete('/usuarios/:id', autenticar, autorizar(ACAO.GERENCIAR_USUARIOS), usuarios.remover);

  return router;
}
