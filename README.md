# EpiLog

Diário e catálogo de séries de TV. Você pesquisa séries existentes, registra cada **episódio** assistido (com data e reassistidas), acompanha o progresso por temporada, dá nota e escreve resenhas sobre a **série**, organiza listas e acompanha as resenhas de quem segue. Inspirado no Letterboxd, adaptado ao nível de episódios.

Trabalho final de Desenvolvimento Web (OTES-02) — UDESC, 2026/2.
Autores: Nivea Maria Seger e Enzo Holtz Lourenço · Professora: Débora Cabral Nazário.

- Projeto (resumo expandido), design e plano: [`docs/`](docs/)
- Arquitetura: React + Vite → API REST Express → Supabase (PostgreSQL + Auth, com RLS) e TMDB

## Requisitos

- **Node.js 24 ou mais novo** (`node -v`)
- As chaves do projeto Supabase compartilhado e o token de leitura do TMDB. **Peça ao Enzo, em privado**; elas nunca vão para o Git.

## Configurar

```bash
git clone <url-do-repositório> epilog
cd epilog
npm install
cp api/.env.example api/.env   # preencha SUPABASE_*, TMDB_READ_TOKEN
cp web/.env.example web/.env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
```

A `SUPABASE_SECRET_KEY` só existe em `api/.env`. Ela nunca vai para o `web/`.

## Banco de dados

O esquema fica em `supabase/migrations/` (tabelas, regras de acesso RLS e funções). **O projeto compartilhado já está com as migrações aplicadas.** Só rode o comando abaixo se for criar um projeto novo ou se uma migração nova entrar por PR:

```bash
# O host direto do banco é só IPv6; o session pooler funciona em IPv4.
npx supabase db push --remote="postgresql://postgres.<ref>:<senha-do-banco>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

Alternativa: colar os arquivos de `supabase/migrations/`, em ordem, no SQL Editor do painel do Supabase.
No projeto, **Authentication → Sign In / Providers → Email → "Confirm email"** fica desligado. O envio gratuito de e-mails tem limite baixo e travaria os cadastros.

## Rodar

```bash
npm run dev
```

- Interface: http://localhost:5173
- API: http://localhost:3333/api (o Vite repassa `/api` para ela)

## Testes

```bash
npm test                          # testes automatizados da API e funções puras do front
npm run verificar:banco -w api    # confere as regras do banco no Supabase real (cria e apaga usuários de teste)
```

O roteiro manual das telas está em [`docs/roteiro-verificacao.md`](docs/roteiro-verificacao.md).

## Estrutura

```
api/src/
  app.js · server.js · config.js · erros.js · supabase.js
  middleware/auth.js        # valida o token e entrega req.usuario + req.db (cliente com RLS)
  util/paginacao.js         # cursor (chave, id) e páginas de 20
  catalogo/                 # TMDB, cache no banco e rotas públicas (único módulo com a chave secreta)
  perfis/  diario/  estado/
web/src/
  rotas.jsx · main.jsx · lib/ (api, supabase, datas) · auth/ · layout/ · componentes/
  catalogo/  conta/  diario/  sobre/
supabase/migrations/        # esquema, RLS e funções
```

## Como adicionar uma funcionalidade

Use o **diário** como modelo, de ponta a ponta:

1. **Validação:** `api/src/diario/esquemas.js` (zod, mensagens em português).
2. **Rotas:** `api/src/diario/rotas.js`. Use sempre `req.db`, o cliente do próprio usuário, e passe `exigir` nas rotas pessoais. Erros do banco passam por `traduzirErroBanco`.
3. **Montar** o router em `api/src/app.js` e escrever os testes em `api/test/` (veja `criarDbFalso` em `test/ajudantes.js`).
4. **Front:** consultas e mutações em `web/src/diario/consultas.js` (TanStack Query), a página em `web/src/diario/`, e a rota em `web/src/rotas.jsx`.

Regras:
- **Nenhum PR mexe em migração sem combinar antes.** O banco inteiro (inclusive as tabelas de avaliação, listas e social) já existe.
- Não use `upsert` com o cliente do usuário. As permissões por coluna de `perfil` e `lista` bloqueiam.

## Fluxo de trabalho

- Branch a partir de `main`: `feat/<rf>-<nome>`, por exemplo `feat/rf04-avaliacoes`.
- PR para `main`, revisado pela outra pessoa, com `npm test` passando.
- Mensagens de commit em português: `feat(api): ...`, `feat(web): ...`, `fix: ...`.

## Créditos

<img src="web/public/tmdb-logo.svg" alt="TMDB" height="16">

This product uses the TMDB API but is not endorsed or certified by TMDB.
