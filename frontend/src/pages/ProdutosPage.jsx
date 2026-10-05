import { useCallback, useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import Pagination from '../components/Pagination.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, formatarData } from '../services/api.js';

const FILTROS_VAZIOS = { nome: '', dataInicio: '', dataFim: '' };
const FORM_VAZIO = { nome: '', descricao: '', unidade: 'UN', saldoInicial: 0 };

export default function ProdutosPage() {
  const { ehAdmin } = useAuth(); // só o administrador vê a ação de excluir
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);
  const [page, setPage] = useState(1);
  const [dados, setDados] = useState({ itens: [], total: 0, totalPages: 1 });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [editando, setEditando] = useState(null); // null | 'novo' | produto
  const [form, setForm] = useState(FORM_VAZIO);

  const carregar = useCallback(async () => {
    try {
      setDados(await api.get('/produtos', { ...aplicados, page, limit: 10 }));
      setErro('');
    } catch (err) {
      setErro(err.message);
    }
  }, [aplicados, page]);

  useEffect(() => { carregar(); }, [carregar]);

  function buscar(e) {
    e.preventDefault();
    setPage(1);
    setAplicados(filtros);
  }

  function limpar() {
    setFiltros(FILTROS_VAZIOS);
    setAplicados(FILTROS_VAZIOS);
    setPage(1);
  }

  function abrirForm(produto) {
    setErro(''); setSucesso('');
    setEditando(produto ?? 'novo');
    setForm(produto ? { nome: produto.nome, descricao: produto.descricao ?? '', unidade: produto.unidade } : FORM_VAZIO);
  }

  async function salvar(e) {
    e.preventDefault();
    try {
      if (editando === 'novo') {
        await api.post('/produtos', { ...form, saldoInicial: Number(form.saldoInicial) });
        setSucesso('Produto cadastrado.');
      } else {
        await api.put(`/produtos/${editando.id}`, { nome: form.nome, descricao: form.descricao, unidade: form.unidade });
        setSucesso('Produto atualizado.');
      }
      setEditando(null);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function excluir(produto) {
    if (!window.confirm(`Excluir o produto "${produto.nome}"?`)) return;
    try {
      await api.delete(`/produtos/${produto.id}`);
      setSucesso('Produto excluído.');
      setErro('');
      carregar();
    } catch (err) {
      setSucesso('');
      setErro(err.message);
    }
  }

  return (
    <>
      <div className="titulo-pagina">
        <h2>Produtos</h2>
        <button className="btn" onClick={() => abrirForm()}>Novo produto</button>
      </div>
      <Alert tipo="erro">{erro}</Alert>
      <Alert tipo="sucesso">{sucesso}</Alert>

      {editando && (
        <form className="card form-grid" onSubmit={salvar}>
          <h3>{editando === 'novo' ? 'Novo produto' : 'Editar produto'}</h3>
          <label>Nome
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required minLength={2} />
          </label>
          <label>Unidade
            <input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} required maxLength={10} />
          </label>
          <label className="largo">Descrição
            <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} maxLength={300} />
          </label>
          {editando === 'novo' && (
            <label>Saldo inicial
              <input type="number" min="0" step="1" value={form.saldoInicial}
                onChange={(e) => setForm({ ...form, saldoInicial: e.target.value })} />
            </label>
          )}
          <div className="acoes largo">
            <button className="btn">Salvar</button>
            <button type="button" className="btn btn-secundario" onClick={() => setEditando(null)}>Cancelar</button>
          </div>
          {editando !== 'novo' && <small className="muted largo">O saldo só muda por movimentações de entrada e saída.</small>}
        </form>
      )}

      <form className="card filtros" onSubmit={buscar}>
        <label>Nome
          <input value={filtros.nome} onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })} placeholder="Ex.: detergente" />
        </label>
        <label>Cadastrado de
          <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} />
        </label>
        <label>até
          <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} />
        </label>
        <div className="acoes">
          <button className="btn">Buscar</button>
          <button type="button" className="btn btn-secundario" onClick={limpar}>Limpar</button>
        </div>
      </form>

      <div className="card tabela-wrap">
        <table>
          <thead>
            <tr><th>Produto</th><th>Unid.</th><th className="num">Saldo</th><th>Cadastro</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {dados.itens.map((p) => (
              <tr key={p.id}>
                <td>{p.nome}{p.descricao && <small className="muted bloco">{p.descricao}</small>}</td>
                <td>{p.unidade}</td>
                <td className={`num ${p.saldo === 0 ? 'zerado' : ''}`}>{p.saldo}</td>
                <td>{formatarData(p.criadoEm)}</td>
                <td className="acoes">
                  <button className="btn btn-secundario" onClick={() => abrirForm(p)}>Editar</button>
                  {ehAdmin && <button className="btn btn-perigo" onClick={() => excluir(p)}>Excluir</button>}
                </td>
              </tr>
            ))}
            {dados.itens.length === 0 && <tr><td colSpan="5" className="muted">Nenhum produto encontrado.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} totalPages={dados.totalPages} total={dados.total} onChange={setPage} />
      </div>
    </>
  );
}
