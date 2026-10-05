// Composição das dependências (repositórios -> serviços -> controllers -> middlewares).
import { criarAuthController } from './controllers/auth.controller.js';
import { criarMovimentacaoController } from './controllers/movimentacao.controller.js';
import { criarProdutoController } from './controllers/produto.controller.js';
import { criarUsuarioController } from './controllers/usuario.controller.js';
import { criarAutenticar } from './middlewares/autenticar.js';
import { criarLimitadorLogin } from './middlewares/limitar-login.js';
import { criarMovimentacaoRepository } from './repositories/movimentacao.repository.js';
import { criarProdutoRepository } from './repositories/produto.repository.js';
import { criarUsuarioRepository } from './repositories/usuario.repository.js';
import { criarAuthService } from './services/auth.service.js';
import { criarMovimentacaoService } from './services/movimentacao.service.js';
import { criarProdutoService } from './services/produto.service.js';
import { criarUsuarioService } from './services/usuario.service.js';

export function criarContainer(db, config) {
  const repositorios = {
    usuarios: criarUsuarioRepository(db),
    produtos: criarProdutoRepository(db),
    movimentacoes: criarMovimentacaoRepository(db),
  };
  const { usuarios, produtos, movimentacoes } = repositorios;

  const servicos = {
    authService: criarAuthService({ usuarios, config }),
    usuarioService: criarUsuarioService({ usuarios, movimentacoes }),
    produtoService: criarProdutoService({ db, produtos, movimentacoes }),
    movimentacaoService: criarMovimentacaoService({ db, produtos, movimentacoes }),
  };

  return {
    repositorios,
    servicos,
    controllers: {
      auth: criarAuthController(servicos),
      usuarios: criarUsuarioController(servicos),
      produtos: criarProdutoController(servicos),
      movimentacoes: criarMovimentacaoController(servicos),
    },
    middlewares: {
      autenticar: criarAutenticar({ usuarios, config }),
      limitarLogin: criarLimitadorLogin(),
    },
  };
}
