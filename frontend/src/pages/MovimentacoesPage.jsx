import { useCallback, useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import Pagination from '../components/Pagination.jsx';
import { api, formatarDataHora } from '../services/api.js';

const ROTULO_TIPO = { ENTRADA: 'Entrada', SAIDA: 'Saída' };

export default function MovimentacoesPage() {
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState({ produtoId: '', tipo: 'SAIDA', quantidade: '', observacao: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [historico, setHistorico] = useState({ itens: [], total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState('');

  const carregarProdutos = useCallback(async () => {
    const resposta = await api.get('/produtos', { limit: 100 });
    setProdutos(resposta.itens);
    setForm((atual) => (atual.produtoId || !resposta.itens.length ? atual : { ...atual, produtoId: String(resposta.itens[0].id) }));
  }, []);

  const carregarHistorico = useCallback(async () => {
    setHistorico(await api.get('/movimentacoes', { tipo: filtroTipo, page, limit: 6 }));
  }, [filtroTipo, page]);

  useEffect(() => { carregarProdutos().catch((e) => setErro(e.message)); }, [carregarProdutos]);
  useEffect(() => { carregarHistorico().catch((e) => setErro(e.message)); }, [carregarHistorico]);

  const selecionado = produtos.find((p) => String(p.id) === form.produtoId);

  async function registrar(e) {
    e.preventDefault();
    setErro(''); setSucesso('');
    try {
      const rota = form.tipo === 'SAIDA' ? '/movimentacoes/saida' : '/movimentacoes/entrada';
      const mov = await api.post(rota, {
        produtoId: Number(form.produtoId),
        quantidade: Number(form.quantidade),
        observacao: form.observacao || undefined,
      });
      setSucesso(`${ROTULO_TIPO[mov.tipo]} registrada: ${mov.quantidade} ${mov.unidade} de ${mov.produtoNome}. Novo saldo: ${mov.saldoPosterior}.`);
      setForm((atual) => ({ ...atual, quantidade: '', observacao: '' }));
      setPage(1);
      await Promise.all([carregarProdutos(), carregarHistorico()]);
    } catch (err) {
      setErro(err.message); // ex.: "Saída não permitida: estoque insuficiente. Disponível: X. Solicitado: Y."
    }
  }

  return (
    <>
      <h2>Movimentações de estoque</h2>
      <form className="card form-grid" onSubmit={registrar}>
        <h3>Registrar movimentação</h3>
        <Alert tipo="erro">{erro}</Alert>
        <Alert tipo="sucesso">{sucesso}</Alert>

        <label>Produto
          <select value={form.produtoId} onChange={(e) => setForm({ ...form, produtoId: e.target.value })} required>
            {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          {selecionado && <small className="muted">Saldo disponível: <strong>{selecionado.saldo} {selecionado.unidade}</strong></small>}
        </label>
        <label>Tipo de movimentação
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="SAIDA">Saída</option>
            <option value="ENTRADA">Entrada</option>
          </select>
        </label>
        <label>Quantidade
          <input type="number" min="1" step="1" value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })} required />
        </label>
        <label>Observação
          <input value={form.observacao} maxLength={300} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
        </label>
        <div className="acoes largo"><button className="btn">Registrar</button></div>
      </form>

      <div className="card tabela-wrap">
        <div className="titulo-pagina">
          <h3>Histórico</h3>
          <select aria-label="Filtrar histórico por tipo" value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}>
            <option value="">Todos os tipos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SAIDA">Saídas</option>
          </select>
        </div>
        <table>
          <thead>
            <tr><th>Data/hora</th><th>Tipo</th><th>Produto</th><th className="num">Qtd.</th><th className="num">Saldo após</th><th>Responsável</th></tr>
          </thead>
          <tbody>
            {historico.itens.map((m) => (
              <tr key={m.id}>
                <td>{formatarDataHora(m.dataHora)}</td>
                <td><span className={`tag tag-${m.tipo.toLowerCase()}`}>{ROTULO_TIPO[m.tipo]}</span></td>
                <td>{m.produtoNome}</td>
                <td className="num">{m.quantidade}</td>
                <td className="num">{m.saldoPosterior}</td>
                <td>{m.usuarioNome}</td>
              </tr>
            ))}
            {historico.itens.length === 0 && <tr><td colSpan="6" className="muted">Nenhuma movimentação.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} totalPages={historico.totalPages} total={historico.total} onChange={setPage} />
      </div>
    </>
  );
}
