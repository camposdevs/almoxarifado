import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { assinarToken } from '../src/utils/jwt.js';
import { ADMIN, OPERADOR, SEGREDO_TESTE, iniciarApi } from './helpers.js';

describe('Autenticação e rotas privadas', () => {
  let api;
  before(async () => { api = await iniciarApi(); });
  after(() => api.fechar());

  it('cadastra usuário sempre com perfil OPERADOR (ignora perfil enviado)', async () => {
    const { status, corpo } = await api.requisitar('POST', '/auth/register', {
      corpo: { nome: 'Maria Souza', email: 'Maria@Teste.com', senha: 'senha1234', perfil: 'ADMIN' },
    });
    assert.equal(status, 201);
    assert.equal(corpo.perfil, 'OPERADOR');
    assert.equal(corpo.email, 'maria@teste.com');
    assert.equal(corpo.senhaHash, undefined);
  });

  it('não permite e-mail duplicado nem senha fraca', async () => {
    const duplicado = await api.requisitar('POST', '/auth/register', {
      corpo: { nome: 'Outra Maria', email: 'maria@teste.com', senha: 'senha1234' },
    });
    assert.equal(duplicado.status, 409);
    const fraca = await api.requisitar('POST', '/auth/register', {
      corpo: { nome: 'João Lima', email: 'joao@teste.com', senha: 'abc' },
    });
    assert.equal(fraca.status, 400);
  });

  it('guarda a senha apenas como hash', () => {
    const { senha_hash: hash } = api.db.prepare('SELECT senha_hash FROM usuarios WHERE email = ?').get(ADMIN.email);
    assert.ok(hash.startsWith('scrypt$'));
    assert.ok(!hash.includes(ADMIN.senha));
  });

  it('autentica e identifica o tipo de usuário', async () => {
    const { status, corpo } = await api.requisitar('POST', '/auth/login', { corpo: ADMIN });
    assert.equal(status, 200);
    assert.equal(corpo.usuario.perfil, 'ADMIN');
    assert.equal(corpo.usuario.senhaHash, undefined);

    const me = await api.requisitar('GET', '/auth/me', { token: corpo.token });
    assert.equal(me.corpo.perfil, 'ADMIN');
  });

  it('usa a mesma mensagem para e-mail inexistente e senha errada', async () => {
    const senhaErrada = await api.requisitar('POST', '/auth/login', { corpo: { email: ADMIN.email, senha: 'errada123' } });
    const semUsuario = await api.requisitar('POST', '/auth/login', { corpo: { email: 'x@y.com', senha: 'errada123' } });
    assert.equal(senhaErrada.status, 401);
    assert.equal(semUsuario.status, 401);
    assert.equal(senhaErrada.corpo.erro, semUsuario.corpo.erro);
  });

  it('bloqueia rotas privadas sem token, com token adulterado ou expirado', async () => {
    assert.equal((await api.requisitar('GET', '/produtos')).status, 401);

    const token = await api.login(OPERADOR);
    const adulterado = token.slice(0, -3) + 'abc';
    assert.equal((await api.requisitar('GET', '/produtos', { token: adulterado })).status, 401);

    const expirado = assinarToken({ sub: 1, perfil: 'ADMIN' }, SEGREDO_TESTE, -10);
    assert.equal((await api.requisitar('GET', '/produtos', { token: expirado })).status, 401);

    const outroSegredo = assinarToken({ sub: 1, perfil: 'ADMIN' }, 'outro-segredo', 60);
    assert.equal((await api.requisitar('GET', '/produtos', { token: outroSegredo })).status, 401);
  });

  it('rejeita JSON inválido e rota inexistente', async () => {
    const invalido = await api.requisitar('POST', '/auth/login', { bruto: '{nao-e-json' });
    assert.equal(invalido.status, 400);
    assert.equal((await api.requisitar('GET', '/nao-existe')).status, 404);
  });
});
