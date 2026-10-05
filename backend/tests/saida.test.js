import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ADMIN, OPERADOR, criarProduto, iniciarApi } from './helpers.js';

const contarMovimentacoes = (api, produtoId, tipo = 'SAIDA') =>
  api.db.prepare('SELECT COUNT(*) AS n FROM movimentacoes WHERE produto_id = ? AND tipo = ?').get(produtoId, tipo).n;

describe('Saída de produto (validação de saldo)', () => {
  let api;
  let tokenAdmin;
  let tokenOperador;

  before(async () => {
    api = await iniciarApi();
    tokenAdmin = await api.login(ADMIN);
    tokenOperador = await api.login(OPERADOR);
  });
  after(() => api.fechar());

  const saida = (token, corpo) => api.requisitar('POST', '/movimentacoes/saida', { token, corpo });

  it('CT-01: registra a saída quando a quantidade é menor que o saldo', async () => {
    const produto = await criarProduto(api, tokenAdmin, 50);
    const antes = new Date().toISOString();
    const { status, corpo } = await saida(tokenOperador, { produtoId: produto.id, quantidade: 20 });

    assert.equal(status, 201);
    assert.equal(corpo.tipo, 'SAIDA');
    assert.equal(corpo.quantidade, 20);
    assert.equal(corpo.saldoAnterior, 50);
    assert.equal(corpo.saldoPosterior, 30);
    assert.equal(corpo.usuarioNome, 'Operador de Almoxarifado');
    assert.ok(corpo.dataHora >= antes, 'data/hora deve ser a do registro');

    const atualizado = await api.requisitar('GET', `/produtos/${produto.id}`, { token: tokenOperador });
    assert.equal(atualizado.corpo.saldo, 30);
  });

  it('CT-02: registra a saída quando a quantidade é igual ao saldo (saldo fica zerado)', async () => {
    const produto = await criarProduto(api, tokenAdmin, 15);
    const { status, corpo } = await saida(tokenOperador, { produtoId: produto.id, quantidade: 15 });

    assert.equal(status, 201);
    assert.equal(corpo.saldoPosterior, 0);
    const atualizado = await api.requisitar('GET', `/produtos/${produto.id}`, { token: tokenOperador });
    assert.equal(atualizado.corpo.saldo, 0);
  });

  it('CT-03: bloqueia a saída acima do saldo, com mensagem clara, sem alterar saldo nem registrar movimentação', async () => {
    const produto = await criarProduto(api, tokenAdmin, 10);
    const { status, corpo } = await saida(tokenOperador, { produtoId: produto.id, quantidade: 25 });

    assert.equal(status, 422);
    assert.equal(corpo.erro, 'Saída não permitida: estoque insuficiente. Disponível: 10. Solicitado: 25.');
    const atualizado = await api.requisitar('GET', `/produtos/${produto.id}`, { token: tokenOperador });
    assert.equal(atualizado.corpo.saldo, 10);
    assert.equal(contarMovimentacoes(api, produto.id), 0);
  });

  it('CT-04: exige autenticação para registrar saída', async () => {
    const produto = await criarProduto(api, tokenAdmin, 40);
    const { status, corpo } = await saida(undefined, { produtoId: produto.id, quantidade: 5 });

    assert.equal(status, 401);
    assert.equal(corpo.erro, 'Autenticação necessária.');
    assert.equal(contarMovimentacoes(api, produto.id), 0);
  });

  it('CT-05: rejeita quantidade inválida (zero, negativa, decimal, texto, ausente)', async () => {
    const produto = await criarProduto(api, tokenAdmin, 40);
    for (const quantidade of [0, -5, 1.5, '5', null, undefined]) {
      const { status } = await saida(tokenOperador, { produtoId: produto.id, quantidade });
      assert.equal(status, 400, `quantidade ${JSON.stringify(quantidade)} deveria ser rejeitada`);
    }
    const atualizado = await api.requisitar('GET', `/produtos/${produto.id}`, { token: tokenOperador });
    assert.equal(atualizado.corpo.saldo, 40);
    assert.equal(contarMovimentacoes(api, produto.id), 0);
  });

  it('retorna 404 para produto inexistente', async () => {
    const { status } = await saida(tokenOperador, { produtoId: 999999, quantidade: 1 });
    assert.equal(status, 404);
  });

  it('usa o responsável do token e ignora usuarioId/dataHora enviados no corpo', async () => {
    const produto = await criarProduto(api, tokenAdmin, 5);
    const { corpo } = await saida(tokenOperador, {
      produtoId: produto.id, quantidade: 1, usuarioId: 1, dataHora: '2000-01-01T00:00:00.000Z',
    });
    assert.equal(corpo.usuarioNome, 'Operador de Almoxarifado');
    assert.notEqual(corpo.dataHora, '2000-01-01T00:00:00.000Z');
  });

  it('mantém o saldo consistente em saídas sucessivas (a segunda é bloqueada)', async () => {
    const produto = await criarProduto(api, tokenAdmin, 10);
    assert.equal((await saida(tokenOperador, { produtoId: produto.id, quantidade: 6 })).status, 201);
    const segunda = await saida(tokenOperador, { produtoId: produto.id, quantidade: 6 });
    assert.equal(segunda.status, 422);
    assert.equal(segunda.corpo.erro, 'Saída não permitida: estoque insuficiente. Disponível: 4. Solicitado: 6.');
  });

  it('a entrada soma ao saldo e fica registrada', async () => {
    const produto = await criarProduto(api, tokenAdmin, 5);
    const { status, corpo } = await api.requisitar('POST', '/movimentacoes/entrada', {
      token: tokenOperador, corpo: { produtoId: produto.id, quantidade: 7, observacao: 'Reposição' },
    });
    assert.equal(status, 201);
    assert.equal(corpo.saldoPosterior, 12);
    assert.equal(contarMovimentacoes(api, produto.id, 'ENTRADA'), 2); // saldo inicial + reposição
  });
});
