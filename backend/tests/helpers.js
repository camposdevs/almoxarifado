import { carregarConfig } from '../src/config/env.js';
import { criarApp } from '../src/app.js';
import { criarBanco } from '../src/database/connection.js';
import { executarSeed } from '../src/database/seed.js';

export const ADMIN = { email: 'admin@almoxarifado.com', senha: 'Admin@123' };
export const OPERADOR = { email: 'operador@almoxarifado.com', senha: 'Operador@123' };
export const SEGREDO_TESTE = 'segredo-de-teste';

// Sobe a API real (HTTP) em porta aleatória com banco SQLite em memória já populado pelo seed.
export async function iniciarApi() {
  const config = carregarConfig({ JWT_SECRET: SEGREDO_TESTE });
  const db = criarBanco(':memory:');
  await executarSeed(db, config);
  const servidor = criarApp({ db, config });
  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${servidor.address().port}`;

  async function requisitar(metodo, caminho, { token, corpo, bruto } = {}) {
    const resposta = await fetch(baseUrl + caminho, {
      method: metodo,
      headers: {
        ...(corpo !== undefined || bruto !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: bruto ?? (corpo !== undefined ? JSON.stringify(corpo) : undefined),
    });
    const texto = await resposta.text();
    return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
  }

  async function login({ email, senha }) {
    const { corpo } = await requisitar('POST', '/auth/login', { corpo: { email, senha } });
    return corpo.token;
  }

  return {
    db, baseUrl, requisitar, login, config,
    fechar: () => new Promise((resolve) => servidor.close(() => { db.close(); resolve(); })),
  };
}

let contador = 0;
// Cria um produto novo (via API, como administrador) com saldo inicial conhecido.
export async function criarProduto(api, tokenAdmin, saldoInicial, nome) {
  contador += 1;
  const { corpo } = await api.requisitar('POST', '/produtos', {
    token: tokenAdmin,
    corpo: { nome: nome ?? `Produto de teste ${contador}`, unidade: 'UN', saldoInicial },
  });
  return corpo;
}
