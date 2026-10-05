import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ADMIN, OPERADOR, iniciarApi } from './helpers.js';

describe('Listagem com paginação e filtros', () => {
  let api;
  let token;
  const hoje = new Date().toISOString().slice(0, 10);
  before(async () => {
    api = await iniciarApi();
    token = await api.login(OPERADOR);
  });
  after(() => api.fechar());

  const listar = (consulta) => api.requisitar('GET', `/produtos?${consulta}`, { token });

  it('pagina os resultados (12 produtos do seed, 5 por página)', async () => {
    const p3 = await listar('page=3&limit=5');
    assert.equal(p3.status, 200);
    assert.equal(p3.corpo.total, 12);
    assert.equal(p3.corpo.totalPages, 3);
    assert.equal(p3.corpo.itens.length, 2);
    assert.equal((await listar('limit=5')).corpo.itens.length, 5);
  });

  it('filtra por nome ignorando acentos e maiúsculas', async () => {
    const { corpo } = await listar('nome=AGUA san');
    assert.equal(corpo.total, 1);
    assert.equal(corpo.itens[0].nome, 'Água Sanitária 5L');
  });

  it('trata % e _ do filtro como texto literal', async () => {
    const porcento = await listar('nome=%25'); // só "Álcool 70% 1L" contém o caractere %
    assert.equal(porcento.corpo.total, 1);
    assert.equal(porcento.corpo.itens[0].nome, 'Álcool 70% 1L');
    assert.equal((await listar('nome=_')).corpo.total, 0); // "_" não deve funcionar como curinga
  });

  it('filtra por data de cadastro', async () => {
    assert.equal((await listar(`dataInicio=${hoje}&dataFim=${hoje}`)).corpo.total, 12);
    assert.equal((await listar('dataInicio=2999-01-01')).corpo.total, 0);
    assert.equal((await listar('dataFim=2000-01-01')).corpo.total, 0);
  });

  it('valida parâmetros de consulta', async () => {
    assert.equal((await listar('dataInicio=31-12-2026')).status, 400);
    assert.equal((await listar('dataInicio=2026-12-31&dataFim=2026-01-01')).status, 400);
    assert.equal((await listar('limit=1000')).status, 400);
    assert.equal((await listar('page=0')).status, 400);
  });

  it('o saldo não pode ser alterado por atualização de produto', async () => {
    const { corpo } = await listar('limit=1');
    const tentativa = await api.requisitar('PUT', `/produtos/${corpo.itens[0].id}`, {
      token, corpo: { nome: corpo.itens[0].nome, saldo: 9999 },
    });
    assert.equal(tentativa.status, 400);
  });

  it('lista movimentações com data/hora e responsável, filtrando por tipo', async () => {
    const adminToken = await api.login(ADMIN);
    const { corpo } = await api.requisitar('GET', '/movimentacoes?tipo=ENTRADA&limit=3', { token: adminToken });
    assert.equal(corpo.total, 12);
    assert.equal(corpo.itens.length, 3);
    assert.ok(corpo.itens[0].dataHora);
    assert.equal(corpo.itens[0].usuarioNome, 'Administrador do Sistema');
    assert.equal((await api.requisitar('GET', '/movimentacoes?tipo=XYZ', { token: adminToken })).status, 400);
  });
});
