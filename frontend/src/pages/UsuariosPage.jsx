import { useCallback, useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import Pagination from '../components/Pagination.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, formatarData } from '../services/api.js';

const FORM_VAZIO = { nome: '', email: '', senha: '', perfil: 'OPERADOR' };

export default function UsuariosPage() {
  const { usuario: logado } = useAuth();
  const [dados, setDados] = useState({ itens: [], total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregar = useCallback(async () => {
    try { setDados(await api.get('/usuarios', { page, limit: 10 })); } catch (err) { setErro(err.message); }
  }, [page]);
  useEffect(() => { carregar(); }, [carregar]);

  async function criar(e) {
    e.preventDefault();
    setErro(''); setSucesso('');
    try {
      await api.post('/usuarios', form);
      setSucesso('Usuário criado.');
      setForm(FORM_VAZIO);
      carregar();
    } catch (err) { setErro(err.message); }
  }

  async function excluir(u) {
    if (!window.confirm(`Excluir o usuário "${u.nome}"?`)) return;
    setErro(''); setSucesso('');
    try {
      await api.delete(`/usuarios/${u.id}`);
      setSucesso('Usuário excluído.');
      carregar();
    } catch (err) { setErro(err.message); }
  }

  return (
    <>
      <h2>Usuários</h2>
      <Alert tipo="erro">{erro}</Alert>
      <Alert tipo="sucesso">{sucesso}</Alert>

      <form className="card form-grid" onSubmit={criar}>
        <h3>Novo usuário</h3>
        <label>Nome<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required minLength={2} /></label>
        <label>E-mail<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Senha<input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} required minLength={8} autoComplete="new-password" /></label>
        <label>Perfil
          <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
            <option value="OPERADOR">Operador de Almoxarifado</option>
            <option value="ADMIN">Administrador do Sistema</option>
          </select>
        </label>
        <div className="acoes largo"><button className="btn">Criar usuário</button></div>
      </form>

      <div className="card tabela-wrap">
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Cadastro</th><th>Ações</th></tr></thead>
          <tbody>
            {dados.itens.map((u) => (
              <tr key={u.id}>
                <td>{u.nome}</td><td>{u.email}</td>
                <td>{u.perfil === 'ADMIN' ? 'Administrador' : 'Operador'}</td>
                <td>{formatarData(u.criadoEm)}</td>
                <td>{u.id !== logado.id && <button className="btn btn-perigo" onClick={() => excluir(u)}>Excluir</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={dados.totalPages} total={dados.total} onChange={setPage} />
      </div>
    </>
  );
}
