# Sistema de Almoxarifado

Sistema para controle de insumos de uma empresa de materiais de limpeza, com **controle de saldo**, **perfis de acesso** e **rastreabilidade** de todas as movimentações.

- **Backend:** Node.js (≥ 22.5) + SQLite — API REST em camadas, **sem dependências externas** (não precisa de `npm install`).
- **Frontend:** React + Vite.

## Como executar

```bash
# 1) API (http://localhost:3001)
cd backend
npm run seed      # cria o banco com usuários e produtos de exemplo
npm start

# 2) Interface (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Usuários de exemplo (criados pelo seed — troque as senhas fora do ambiente de estudo):

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador do Sistema | admin@almoxarifado.com | Admin@123 |
| Operador de Almoxarifado | operador@almoxarifado.com | Operador@123 |

Variáveis de ambiente: veja `backend/.env.example` e `frontend/.env.example`.

## Arquitetura (camadas)

```
backend/src
├── routes/         # mapa de rotas + permissão exigida por rota
├── middlewares/    # autenticar (JWT), autorizar (perfil), limitar-login
├── controllers/    # recebem a requisição, validam parâmetros e devolvem a resposta
├── services/       # regras de negócio (saldo, perfis, rastreabilidade)
├── repositories/   # único ponto de acesso ao banco (SQL parametrizado)
├── models/         # perfis, ações e tipos de movimentação
├── database/       # schema, conexão/transação e seed
├── core/           # roteador HTTP
├── utils/          # JWT, hash de senha, validadores, erros
├── container.js    # composição das dependências (injeção)
└── app.js          # servidor HTTP (CORS, cabeçalhos de segurança, tratamento de erros)
```

Fluxo: `rota → middlewares (autenticar, autorizar) → controller → service → repository → banco`.
A regra do saldo fica no **service** (`movimentacao.service.js`), nunca na rota ou no front.

## Regras de negócio implementadas

- **Dois perfis:** Operador (consultar, inserir e atualizar) e Administrador (também deleta e gerencia usuários). Permissões em `models/perfil.js`, aplicadas por rota.
- **Rotas privadas:** tudo exige token (JWT), exceto `/auth/login`, `/auth/register` e `/saude`. O usuário é recarregado do banco a cada requisição.
- **Cadastro público** cria sempre um Operador; Administradores só são criados por outro Administrador.
- **Saída de produto** só é registrada se `quantidade ≤ saldo`. Caso contrário retorna HTTP 422 com:
  `Saída não permitida: estoque insuficiente. Disponível: X. Solicitado: Y.`
- **Saldo consistente:** saldo e movimentação são gravados na **mesma transação**; o débito é atômico (`UPDATE ... WHERE saldo >= quantidade`) e o banco ainda tem `CHECK (saldo >= 0)`.
- **Rastreabilidade:** toda entrada/saída grava data/hora e usuário responsável (vindos do servidor/token, nunca do corpo da requisição), além do saldo antes e depois. Movimentações não podem ser editadas nem apagadas; produto/usuário com movimentações não podem ser excluídos.
- O saldo **não** pode ser alterado direto no produto; só por movimentação (o saldo inicial vira uma entrada).
- **Listagem de produtos** com paginação (`page`, `limit`) e filtros por nome (sem diferenciar acento/maiúscula) e data de cadastro (`dataInicio`, `dataFim`, formato `AAAA-MM-DD`, em UTC).

## Principais endpoints

| Método | Rota | Perfil |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | público |
| GET | `/auth/me` | autenticado |
| GET | `/produtos?nome=&dataInicio=&dataFim=&page=&limit=` | Operador, Admin |
| POST / PUT | `/produtos`, `/produtos/:id` | Operador, Admin |
| DELETE | `/produtos/:id` | **Admin** |
| GET | `/movimentacoes?produtoId=&tipo=&dataInicio=&dataFim=&page=&limit=` | Operador, Admin |
| POST | `/movimentacoes/entrada`, `/movimentacoes/saida` | Operador, Admin |
| GET / POST / PUT / DELETE | `/usuarios` | **Admin** |

## Testes

```bash
cd backend
npm test        # 30 testes (autenticação, permissões, listagem e saída de produto)
```

Documentação dos testes de saída de produto:

- Plano: `docs/plano_testes.docx`
- Evidências: `docs/testes/cenario1.png` … `cenario5.png`
- Resultados: `resultados.docx` (raiz)

## Entrega (Git)

```bash
git checkout main && git pull
git checkout -b nome-sobrenome            # use seu nome e sobrenome
# copie o conteúdo deste projeto para a pasta do repositório, depois:
git add .gitignore README.md
git commit -m "docs: adiciona README e .gitignore"
git add backend/src backend/package.json backend/.env.example
git commit -m "refactor: reorganiza a API em camadas (routes, controllers, services, repositories)"
git add backend/src/middlewares backend/src/models backend/src/utils
git commit -m "feat: autenticação JWT, perfis Operador/Administrador e rotas privadas"
git add frontend
git commit -m "feat: interface React com login, produtos, movimentações e usuários"
git add backend/tests
git commit -m "test: testes automatizados de autenticação, permissões e saída de produto"
git add docs resultados.docx
git commit -m "docs: plano de testes, evidências e resultados"
git push -u origin nome-sobrenome
```

Depois, no GitHub: **Pull requests → New pull request**, base `main` ← compare `nome-sobrenome`.
"# almoxarifado" 
