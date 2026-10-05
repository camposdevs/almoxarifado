import { pathToFileURL } from 'node:url';
import { carregarConfig } from '../config/env.js';
import { criarContainer } from '../container.js';
import { PERFIL } from '../models/perfil.js';
import { gerarHash } from '../utils/password.js';
import { criarBanco } from './connection.js';

export const USUARIOS_PADRAO = [
  { nome: 'Administrador do Sistema', email: 'admin@almoxarifado.com', senha: 'Admin@123', perfil: PERFIL.ADMIN },
  { nome: 'Operador de Almoxarifado', email: 'operador@almoxarifado.com', senha: 'Operador@123', perfil: PERFIL.OPERADOR },
];

export const PRODUTOS_PADRAO = [
  ['Água Sanitária 5L', 'L', 10], ['Álcool 70% 1L', 'UN', 60], ['Desinfetante Pinho 2L', 'UN', 15],
  ['Detergente Neutro 5L', 'UN', 50], ['Esponja Multiuso', 'PCT', 120], ['Limpa Vidros 500ml', 'UN', 35],
  ['Luva de Borracha M', 'PAR', 30], ['Multiuso 500ml', 'UN', 80], ['Pano de Microfibra', 'UN', 90],
  ['Sabão em Pó 1kg', 'KG', 40], ['Saco de Lixo 100L', 'PCT', 200], ['Vassoura de Nylon', 'UN', 25],
];

// Cria usuários e produtos de exemplo (idempotente). Troque as senhas padrão fora do ambiente de estudo.
export async function executarSeed(db, config) {
  const { repositorios, servicos } = criarContainer(db, config);
  const criados = {};

  for (const u of USUARIOS_PADRAO) {
    criados[u.perfil] =
      repositorios.usuarios.buscarPorEmailComSenha(u.email) ??
      repositorios.usuarios.criar({ nome: u.nome, email: u.email, senhaHash: await gerarHash(u.senha), perfil: u.perfil });
  }
  for (const [nome, unidade, saldoInicial] of PRODUTOS_PADRAO) {
    if (!repositorios.produtos.buscarPorNome(nome)) {
      servicos.produtoService.criar({ nome, unidade, saldoInicial }, criados[PERFIL.ADMIN]);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = carregarConfig();
  const db = criarBanco(config.dbPath);
  await executarSeed(db, config);
  console.log('Seed concluído. Usuários de exemplo:');
  for (const u of USUARIOS_PADRAO) console.log(` - ${u.perfil}: ${u.email} / ${u.senha}`);
  db.close();
}
