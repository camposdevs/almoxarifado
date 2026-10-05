import { emTransacao } from '../database/connection.js';
import { TIPO_MOVIMENTACAO } from '../models/movimentacao.js';
import { HttpError } from '../utils/http-error.js';
import { exigirInteiroPositivo, lerId, paginar, textoOpcional } from '../utils/validators.js';

const mensagemSaldoInsuficiente = (disponivel, solicitado) =>
  `Saída não permitida: estoque insuficiente. Disponível: ${disponivel}. Solicitado: ${solicitado}.`;

function lerDados(dados) {
  return {
    produtoId: lerId(dados.produtoId, 'produtoId'),
    quantidade: exigirInteiroPositivo(dados.quantidade, 'quantidade'),
    observacao: textoOpcional(dados.observacao, 'observacao', 300),
  };
}

export function criarMovimentacaoService({ db, produtos, movimentacoes }) {
  return {
    listar(filtros, paginacao) {
      const { itens, total } = movimentacoes.listar({ ...filtros, ...paginacao });
      return paginar(itens, total, paginacao);
    },

    // Responsável e data/hora vêm do servidor (token), nunca do corpo da requisição.
    registrarEntrada(dados, usuario) {
      const { produtoId, quantidade, observacao } = lerDados(dados);
      return emTransacao(db, () => {
        const produto = produtos.buscarPorId(produtoId);
        if (!produto) throw new HttpError(404, 'Produto não encontrado.');
        const agora = new Date().toISOString();
        produtos.creditarSaldo(produtoId, quantidade, agora);
        return movimentacoes.inserir({
          produtoId, usuarioId: usuario.id, tipo: TIPO_MOVIMENTACAO.ENTRADA, quantidade,
          saldoAnterior: produto.saldo, saldoPosterior: produto.saldo + quantidade, observacao, dataHora: agora,
        });
      });
    },

    // Critérios de aceite: bloqueia se quantidade > saldo; senão registra, atualiza o saldo e grava data/hora + responsável.
    registrarSaida(dados, usuario) {
      const { produtoId, quantidade, observacao } = lerDados(dados);
      return emTransacao(db, () => {
        const produto = produtos.buscarPorId(produtoId);
        if (!produto) throw new HttpError(404, 'Produto não encontrado.');
        if (quantidade > produto.saldo) {
          throw new HttpError(422, mensagemSaldoInsuficiente(produto.saldo, quantidade));
        }

        const agora = new Date().toISOString();
        if (!produtos.debitarSaldo(produtoId, quantidade, agora)) {
          const atual = produtos.buscarPorId(produtoId);
          throw new HttpError(422, mensagemSaldoInsuficiente(atual.saldo, quantidade));
        }
        return movimentacoes.inserir({
          produtoId, usuarioId: usuario.id, tipo: TIPO_MOVIMENTACAO.SAIDA, quantidade,
          saldoAnterior: produto.saldo, saldoPosterior: produto.saldo - quantidade, observacao, dataHora: agora,
        });
      });
    },
  };
}
