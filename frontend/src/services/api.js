const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CHAVE_SESSAO = 'almoxarifado.sessao';

let aoExpirarSessao = () => {};
export const definirAoExpirarSessao = (fn) => { aoExpirarSessao = fn; };

export const lerSessao = () => {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
};
export const salvarSessao = (sessao) => sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
export const limparSessao = () => sessionStorage.removeItem(CHAVE_SESSAO);

export class ApiError extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

async function requisitar(metodo, caminho, { corpo, params } = {}) {
  const url = new URL(BASE_URL + caminho);
  Object.entries(params ?? {}).forEach(([chave, valor]) => {
    if (valor !== '' && valor != null) url.searchParams.set(chave, valor);
  });

  const sessao = lerSessao();
  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: {
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
        ...(sessao ? { Authorization: `Bearer ${sessao.token}` } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor.');
  }

  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (!resposta.ok) {
    if (resposta.status === 401 && sessao) aoExpirarSessao();
    throw new ApiError(resposta.status, dados?.erro ?? 'Erro inesperado.');
  }
  return dados;
}

export const api = {
  get: (caminho, params) => requisitar('GET', caminho, { params }),
  post: (caminho, corpo) => requisitar('POST', caminho, { corpo }),
  put: (caminho, corpo) => requisitar('PUT', caminho, { corpo }),
  delete: (caminho) => requisitar('DELETE', caminho),
};

export const formatarDataHora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
export const formatarData = (iso) => new Date(iso).toLocaleDateString('pt-BR');
