export const SCHEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  perfil      TEXT NOT NULL CHECK (perfil IN ('ADMIN', 'OPERADOR')),
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL UNIQUE COLLATE NOCASE,
  nome_busca    TEXT NOT NULL,
  descricao     TEXT,
  unidade       TEXT NOT NULL DEFAULT 'UN',
  saldo         INTEGER NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id      INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  tipo            TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
  quantidade      INTEGER NOT NULL CHECK (quantidade > 0),
  saldo_anterior  INTEGER NOT NULL,
  saldo_posterior INTEGER NOT NULL CHECK (saldo_posterior >= 0),
  observacao      TEXT,
  data_hora       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mov_produto ON movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_mov_data ON movimentacoes(data_hora);
`;
