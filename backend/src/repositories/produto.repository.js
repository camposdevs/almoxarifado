import { escaparLike, normalizarBusca } from '../utils/validators.js';

const COLUNAS =
  'id, nome, descricao, unidade, saldo, criado_em AS criadoEm, atualizado_em AS atualizadoEm';

function montarFiltro({ nome, dataInicio, dataFim }) {
  const condicoes = [];
  const params = [];
  if (nome) {
    condicoes.push("nome_busca LIKE ? ESCAPE '\\'");
    params.push(`%${escaparLike(normalizarBusca(nome))}%`);
  }
  if (dataInicio) {
    condicoes.push('date(criado_em) >= ?');
    params.push(dataInicio);
  }
  if (dataFim) {
    condicoes.push('date(criado_em) <= ?');
    params.push(dataFim);
  }
  return { where: condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '', params };
}

export function criarProdutoRepository(db) {
  return {
    criar({ nome, descricao, unidade }) {
      const { lastInsertRowid } = db
        .prepare('INSERT INTO produtos (nome, nome_busca, descricao, unidade, saldo) VALUES (?, ?, ?, ?, 0)')
        .run(nome, normalizarBusca(nome), descricao, unidade);
      return this.buscarPorId(Number(lastInsertRowid));
    },
    buscarPorId(id) {
      return db.prepare(`SELECT ${COLUNAS} FROM produtos WHERE id = ?`).get(id);
    },
    buscarPorNome(nome) {
      return db.prepare(`SELECT ${COLUNAS} FROM produtos WHERE nome = ?`).get(nome);
    },
    listar({ nome, dataInicio, dataFim, limit, offset }) {
      const { where, params } = montarFiltro({ nome, dataInicio, dataFim });
      const itens = db
        .prepare(`SELECT ${COLUNAS} FROM produtos ${where} ORDER BY nome LIMIT ? OFFSET ?`)
        .all(...params, limit, offset);
      const { total } = db.prepare(`SELECT COUNT(*) AS total FROM produtos ${where}`).get(...params);
      return { itens, total };
    },
    atualizar(id, { nome, descricao, unidade }, agoraIso) {
      db.prepare(
        'UPDATE produtos SET nome = ?, nome_busca = ?, descricao = ?, unidade = ?, atualizado_em = ? WHERE id = ?',
      ).run(nome, normalizarBusca(nome), descricao, unidade, agoraIso, id);
      return this.buscarPorId(id);
    },
    remover(id) {
      return db.prepare('DELETE FROM produtos WHERE id = ?').run(id).changes > 0;
    },
    // Débito atômico: só altera se ainda houver saldo suficiente (defesa contra corrida).
    debitarSaldo(id, quantidade, agoraIso) {
      return (
        db
          .prepare('UPDATE produtos SET saldo = saldo - ?, atualizado_em = ? WHERE id = ? AND saldo >= ?')
          .run(quantidade, agoraIso, id, quantidade).changes > 0
      );
    },
    creditarSaldo(id, quantidade, agoraIso) {
      db.prepare('UPDATE produtos SET saldo = saldo + ?, atualizado_em = ? WHERE id = ?').run(
        quantidade,
        agoraIso,
        id,
      );
    },
  };
}
