import { HttpError } from './http-error.js';

const falha = (mensagem) => new HttpError(400, mensagem);

export function exigirTexto(valor, campo, { min = 1, max = 255 } = {}) {
  if (typeof valor !== 'string') throw falha(`O campo "${campo}" é obrigatório.`);
  const texto = valor.trim();
  if (texto.length < min || texto.length > max) {
    throw falha(`O campo "${campo}" deve ter entre ${min} e ${max} caracteres.`);
  }
  return texto;
}

export function textoOpcional(valor, campo, max = 500) {
  if (valor === undefined || valor === null || valor === '') return null;
  return exigirTexto(valor, campo, { min: 1, max });
}

export function exigirInteiroPositivo(valor, campo, maximo = 1_000_000) {
  if (!Number.isInteger(valor) || valor <= 0 || valor > maximo) {
    throw falha(`O campo "${campo}" deve ser um número inteiro positivo (máximo ${maximo}).`);
  }
  return valor;
}

export function inteiroNaoNegativo(valor, campo, maximo = 1_000_000) {
  if (!Number.isInteger(valor) || valor < 0 || valor > maximo) {
    throw falha(`O campo "${campo}" deve ser um número inteiro maior ou igual a zero.`);
  }
  return valor;
}

export function validarEmail(valor) {
  const email = exigirTexto(valor, 'email', { min: 5, max: 120 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw falha('E-mail inválido.');
  return email;
}

export function validarSenha(valor) {
  if (typeof valor !== 'string' || valor.length < 8 || valor.length > 100 ||
      !/[A-Za-z]/.test(valor) || !/\d/.test(valor)) {
    throw falha('A senha deve ter de 8 a 100 caracteres, com letras e números.');
  }
  return valor;
}

export function lerId(valor, campo = 'id') {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) throw falha(`Parâmetro "${campo}" inválido.`);
  return numero;
}

export function lerData(valor, campo) {
  if (valor === undefined || valor === '') return undefined;
  const valida = /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
    !Number.isNaN(Date.parse(`${valor}T00:00:00Z`)) &&
    new Date(`${valor}T00:00:00Z`).toISOString().startsWith(valor);
  if (!valida) throw falha(`O parâmetro "${campo}" deve estar no formato AAAA-MM-DD.`);
  return valor;
}

export function lerIntervaloDatas(query) {
  const dataInicio = lerData(query.dataInicio, 'dataInicio');
  const dataFim = lerData(query.dataFim, 'dataFim');
  if (dataInicio && dataFim && dataInicio > dataFim) {
    throw falha('"dataInicio" não pode ser posterior a "dataFim".');
  }
  return { dataInicio, dataFim };
}

export function lerPaginacao(query, limitePadrao = 10, limiteMaximo = 100) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? limitePadrao : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) throw falha('"page" deve ser um inteiro maior ou igual a 1.');
  if (!Number.isInteger(limit) || limit < 1 || limit > limiteMaximo) {
    throw falha(`"limit" deve ser um inteiro entre 1 e ${limiteMaximo}.`);
  }
  return { page, limit, offset: (page - 1) * limit };
}

export function paginar(itens, total, { page, limit }) {
  return { itens, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export const normalizarBusca = (texto) =>
  String(texto).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

export const escaparLike = (texto) => texto.replace(/[\\%_]/g, '\\$&');
