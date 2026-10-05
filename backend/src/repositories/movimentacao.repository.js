const SELECT = `
  SELECT m.id, m.produto_id AS produtoId, p.nome AS produtoNome, p.unidade AS unidade,
         m.usuario_id AS usuarioId, u.nome AS usuarioNome, m.tipo, m.quantidade,
         m.saldo_anterior AS saldoAnterior, m.saldo_posterior AS saldoPosterior,
         m.observacao, m.data_hora AS dataHora
    FROM movimentacoes m
    JOIN produtos p ON p.id = m.produto_id
    JOIN usuarios u ON u.id = m.usuario_id`;

function montarFiltro({ produtoId, tipo, dataInicio, dataFim }) {
  const condicoes = [];
  const params = [];
  if (produtoId) { condicoes.push('m.produto_id = ?'); params.push(produtoId); }
  if (tipo) { condicoes.push('m.tipo = ?'); params.push(tipo); }
  if (dataInicio) { condicoes.push('date(m.data_hora) >= ?'); params.push(dataInicio); }
  if (dataFim) { condicoes.push('date(m.data_hora) <= ?'); params.push(dataFim); }
  return { where: condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '', params };
}

export function criarMovimentacaoRepository(db) {
  return {
    inserir(m) {
      const { lastInsertRowid } = db
        .prepare(
          `INSERT INTO movimentacoes
             (produto_id, usuario_id, tipo, quantidade, saldo_anterior, saldo_posterior, observacao, data_hora)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(m.produtoId, m.usuarioId, m.tipo, m.quantidade, m.saldoAnterior, m.saldoPosterior, m.observacao, m.dataHora);
      return this.buscarPorId(Number(lastInsertRowid));
    },
    buscarPorId(id) {
      return db.prepare(`${SELECT} WHERE m.id = ?`).get(id);
    },
    listar({ produtoId, tipo, dataInicio, dataFim, limit, offset }) {
      const { where, params } = montarFiltro({ produtoId, tipo, dataInicio, dataFim });
      const itens = db
        .prepare(`${SELECT} ${where} ORDER BY m.data_hora DESC, m.id DESC LIMIT ? OFFSET ?`)
        .all(...params, limit, offset);
      const { total } = db
        .prepare(`SELECT COUNT(*) AS total FROM movimentacoes m ${where}`)
        .get(...params);
      return { itens, total };
    },
    existePorProduto(produtoId) {
      return !!db.prepare('SELECT 1 FROM movimentacoes WHERE produto_id = ? LIMIT 1').get(produtoId);
    },
    existePorUsuario(usuarioId) {
      return !!db.prepare('SELECT 1 FROM movimentacoes WHERE usuario_id = ? LIMIT 1').get(usuarioId);
    },
  };
}
