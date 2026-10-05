const COLUNAS = 'id, nome, email, perfil, criado_em AS criadoEm';

export function criarUsuarioRepository(db) {
  return {
    criar({ nome, email, senhaHash, perfil }) {
      const { lastInsertRowid } = db
        .prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)')
        .run(nome, email, senhaHash, perfil);
      return this.buscarPorId(Number(lastInsertRowid));
    },
    buscarPorId(id) {
      return db.prepare(`SELECT ${COLUNAS} FROM usuarios WHERE id = ?`).get(id);
    },
    buscarPorEmailComSenha(email) {
      return db.prepare(`SELECT ${COLUNAS}, senha_hash AS senhaHash FROM usuarios WHERE email = ?`).get(email);
    },
    listar({ limit, offset }) {
      const itens = db
        .prepare(`SELECT ${COLUNAS} FROM usuarios ORDER BY nome LIMIT ? OFFSET ?`)
        .all(limit, offset);
      const { total } = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get();
      return { itens, total };
    },
    atualizar(id, { nome, perfil }) {
      db.prepare('UPDATE usuarios SET nome = ?, perfil = ? WHERE id = ?').run(nome, perfil, id);
      return this.buscarPorId(id);
    },
    remover(id) {
      return db.prepare('DELETE FROM usuarios WHERE id = ?').run(id).changes > 0;
    },
    contarAdmins() {
      return db.prepare("SELECT COUNT(*) AS total FROM usuarios WHERE perfil = 'ADMIN'").get().total;
    },
  };
}
