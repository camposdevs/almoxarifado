import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ADMIN, OPERADOR, criarProduto, iniciarApi } from './helpers.js';

describe('Permissões por perfil', () => {
  let api;
  let admin;
  let operador;
  before(async () => {
    api = await iniciarApi();
    admin = await api.login(ADMIN);
    operador = await api.login(OPERADOR);
  });
  after(() => api.fechar());

  it('operador pode consultar, inserir e atualizar produtos', async () => {
    assert.equal((await api.requisitar('GET', '/produtos', { token: operador })).status, 200);
    const criado = await api.requisitar('POST', '/produtos', { token: operador, corpo: { nome: 'Rodo 40cm' } });
    assert.equal(criado.status, 201);
    const editado = await api.requisitar('PUT', `/produtos/${criado.corpo.id}`, {
      token: operador, corpo: { nome: 'Rodo 45cm', unidade: 'UN' },
    });
    assert.equal(editado.status, 200);
    assert.equal(editado.corpo.nome, 'Rodo 45cm');
  });

  it('operador NÃO pode deletar (403) e o produto permanece', async () => {
    const produto = await criarProduto(api, admin, 0);
    const { status } = await api.requisitar('DELETE', `/produtos/${produto.id}`, { token: operador });
    assert.equal(status, 403);
    assert.equal((await api.requisitar('GET', `/produtos/${produto.id}`, { token: operador })).status, 200);
  });

  it('administrador pode deletar produto sem movimentações', async () => {
    const produto = await criarProduto(api, admin, 0);
    assert.equal((await api.requisitar('DELETE', `/produtos/${produto.id}`, { token: admin })).status, 204);
    assert.equal((await api.requisitar('GET', `/produtos/${produto.id}`, { token: admin })).status, 404);
  });

  it('produto com movimentações não pode ser deletado (rastreabilidade)', async () => {
    const produto = await criarProduto(api, admin, 10);
    assert.equal((await api.requisitar('DELETE', `/produtos/${produto.id}`, { token: admin })).status, 409);
  });

  it('gestão de usuários é exclusiva do administrador', async () => {
    assert.equal((await api.requisitar('GET', '/usuarios', { token: operador })).status, 403);
    assert.equal((await api.requisitar('GET', '/usuarios', { token: admin })).status, 200);

    const novo = { nome: 'Novo Admin', email: 'novo@admin.com', senha: 'senha1234', perfil: 'ADMIN' };
    assert.equal((await api.requisitar('POST', '/usuarios', { token: operador, corpo: novo })).status, 403);
    const criado = await api.requisitar('POST', '/usuarios', { token: admin, corpo: novo });
    assert.equal(criado.status, 201);
    assert.equal(criado.corpo.perfil, 'ADMIN');
  });

  it('o administrador não pode excluir a si mesmo', async () => {
    const eu = await api.requisitar('GET', '/auth/me', { token: admin });
    assert.equal((await api.requisitar('DELETE', `/usuarios/${eu.corpo.id}`, { token: admin })).status, 409);
  });

  it('movimentações não possuem rota de alteração nem exclusão', async () => {
    assert.equal((await api.requisitar('DELETE', '/movimentacoes/1', { token: admin })).status, 404);
    assert.equal((await api.requisitar('PUT', '/movimentacoes/1', { token: admin, corpo: {} })).status, 404);
  });
});
