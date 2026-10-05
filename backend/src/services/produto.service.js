import { emTransacao } from '../database/connection.js';
import { TIPO_MOVIMENTACAO } from '../models/movimentacao.js';
import { HttpError } from '../utils/http-error.js';
import {
  exigirTexto, inteiroNaoNegativo, paginar, textoOpcional,
} from '../utils/validators.js';

function lerCampos(dados) {
  if ('saldo' in dados) {
    throw new HttpError(400, 'O saldo não pode ser alterado diretamente; registre uma movimentação de entrada ou saída.');
  }
  return {
    nome: exigirTexto(dados.nome, 'nome', { min: 2, max: 100 }),
    descricao: textoOpcional(dados.descricao, 'descricao', 300),
    unidade: dados.unidade === undefined ? 'UN' : exigirTexto(dados.unidade, 'unidade', { min: 1, max: 10 }).toUpperCase(),
  };
}

export function criarProdutoService({ db, produtos, movimentacoes }) {
  return {
    listar(filtros, paginacao) {
      const { itens, total } = produtos.listar({ ...filtros, ...paginacao });
      return paginar(itens, total, paginacao);
    },

    buscar(id) {
      const produto = produtos.buscarPorId(id);
      if (!produto) throw new HttpError(404, 'Produto não encontrado.');
      return produto;
    },

    // Se houver saldo inicial, ele entra como uma movimentação de ENTRADA (o saldo sempre tem origem rastreável).
    criar(dados, usuario) {
      const campos = lerCampos(dados);
      const saldoInicial = dados.saldoInicial === undefined ? 0 : inteiroNaoNegativo(dados.saldoInicial, 'saldoInicial');
      if (produtos.buscarPorNome(campos.nome)) throw new HttpError(409, 'Já existe um produto com esse nome.');

      return emTransacao(db, () => {
        const produto = produtos.criar(campos);
        if (saldoInicial > 0) {
          const agora = new Date().toISOString();
          produtos.creditarSaldo(produto.id, saldoInicial, agora);
          movimentacoes.inserir({
            produtoId: produto.id, usuarioId: usuario.id, tipo: TIPO_MOVIMENTACAO.ENTRADA,
            quantidade: saldoInicial, saldoAnterior: 0, saldoPosterior: saldoInicial,
            observacao: 'Saldo inicial', dataHora: agora,
          });
        }
        return produtos.buscarPorId(produto.id);
      });
    },

    atualizar(id, dados) {
      this.buscar(id);
      const campos = lerCampos(dados);
      const outro = produtos.buscarPorNome(campos.nome);
      if (outro && outro.id !== id) throw new HttpError(409, 'Já existe um produto com esse nome.');
      return produtos.atualizar(id, campos, new Date().toISOString());
    },

    remover(id) {
      this.buscar(id);
      if (movimentacoes.existePorProduto(id)) {
        throw new HttpError(409, 'Produto possui movimentações registradas e não pode ser excluído (rastreabilidade).');
      }
      produtos.remover(id);
    },
  };
}
