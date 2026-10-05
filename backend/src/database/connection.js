import { DatabaseSync } from 'node:sqlite';
import { SCHEMA } from './schema.js';

export function criarBanco(caminho) {
  const db = new DatabaseSync(caminho);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

// Executa `fn` de forma atômica: ou tudo é gravado, ou nada (rollback em caso de erro).
export function emTransacao(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }
}
