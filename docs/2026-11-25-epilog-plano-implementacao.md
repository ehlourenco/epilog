# EpiLog — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** implementar o EpiLog (diário e catálogo de séries) com RF01–RF06 funcionando para a apresentação de **02/12/2026**.

**Arquitetura:** React + Vite (navegador) → API REST Express (validação, regras, TMDB) → Supabase PostgreSQL com RLS (acesso **como o usuário**) e Supabase Auth. Só o módulo de catálogo usa a chave secreta, para gravar série/temporada/episódio. O catálogo é consultado no TMDB sob demanda, com cache nas próprias colunas do banco.

**Stack:** Node ≥ 24 (máquina do Enzo: 26), npm workspaces, Express 5, @supabase/supabase-js 2, zod, Vitest + supertest; React 19, Vite, Tailwind CSS v4, React Router 7 (`react-router`), TanStack Query 5; Supabase CLI (via `npx`).

**Spec:** `docs/2026-11-25-epilog-design.md` (o design aprovado). Quem executa lê os dois.

**Onde fica o código [decisão do Claude]:** repositório novo em `/home/enzo/Work/claude_code/udesc/WEB/epilog/`. Todos os caminhos abaixo são relativos a essa pasta. O design e este plano são copiados para `epilog/docs/` na Task 1.

## Restrições globais

- `"engines": { "node": ">=24" }` na raiz. Só JavaScript, sem TypeScript.
- Interface em pt-BR. Tabelas, colunas e rotas em português, como no resumo (`perfil`, `diario`, `/me/diario`).
- `SUPABASE_SECRET_KEY` existe **só** em `api/.env` e é importada **só** por `api/src/catalogo/`. O token do TMDB fica só na API.
- Prefixo da API `/api`, porta `3333`. Erro sempre como `{ "erro": { "codigo": "...", "mensagem": "..." } }`.
- TMDB: `language=pt-BR`, com fallback `en-US` para sinopse vazia. Atribuição com o texto exato **"This product uses the TMDB API but is not endorsed or certified by TMDB"** e o logo oficial.
- `CACHE_CATALOGO_HORAS`: padrão `24`; `0` desliga o cache.
- Apelido: `^[a-z0-9_]{3,20}$`, normalizado para minúsculas. Nota: de 0,5 a 5, em passos de 0,5. Data de visualização nunca no futuro.
- **Nunca usar `upsert` com o cliente do usuário** (as permissões por coluna de `perfil` e `lista` bloqueiam). `upsert` só com o cliente admin, no catálogo.
- Tema escuro, layout começando pelo celular, sem rolagem horizontal em 360 px, WCAG 2.2 básico (§5.7 do design).
- Commits em português, no formato `tipo(escopo): descrição` (ex.: `feat(api): busca de séries no TMDB`).
- ⛔ **Ações externas só com OK explícito do Enzo, na hora:** `supabase db push`, criar repositório no GitHub, `git push` e abrir PR.

## Pontos de atenção na revisão

Situações que o design implica, mas que nenhum teste "natural" pegaria. Cada uma tem teste na task responsável:

1. **Registrar episódio à noite.** A data padrão do formulário é a data **local**, e a API aceita a data de hoje em UTC. Se o front usar `toISOString()`, depois das 21h em Brasília ele preenche "amanhã". Testes: Task 2 (`hojeLocal` com TZ de São Paulo) e Task 8 (`dataNaoFutura`).
2. **ID inexistente digitado na URL** (`/series/999999999`, temporada 99). Deve dar 404 com mensagem clara, não 502 nem tela branca. Testes: Task 4a (cliente TMDB) e Task 4b (rota).
3. **Cursor de paginação adulterado** (`?antes=lixo`). Deve dar 400 `cursor_invalido`, não 500. Teste: Task 8.
4. **Ação repetida** (duplo clique em Seguir/Curtir, ou repetir o pedido). O PUT é idempotente (204 nas duas vezes) e o botão fica desabilitado enquanto a mutação roda. Testes: Task 13 e Task 14.
5. **Apelido com maiúsculas, espaços ou acento** (`" Enzo_99 "`, `"enzo lourenço"`). Normaliza para `enzo_99`, ou rejeita com a regra explicada. Teste: Task 6.

---

## Mapa de arquivos

```
epilog/
├── package.json · .gitignore · .prettierrc · eslint.config.js · README.md
├── docs/  (design, plano, roteiro-verificacao.md, roteiro-apresentacao.md)
├── supabase/  (config.toml, migrations/2026112600000{1,2,3}_*.sql)
├── api/
│   ├── package.json · .env.example
│   ├── scripts/  verificar-banco.js · dados-demo.js (T15)
│   ├── src/
│   │   ├── server.js        # composição (lê env, cria clientes, sobe)
│   │   ├── app.js           # criarApp(deps): middlewares + routers
│   │   ├── config.js · erros.js · supabase.js
│   │   ├── middleware/auth.js
│   │   ├── util/paginacao.js
│   │   ├── catalogo/  tmdb-cliente.js · mapeadores.js · repositorio.js · servico.js · rotas.js
│   │   ├── perfis/    esquemas.js · rotas.js
│   │   ├── diario/    esquemas.js · rotas.js
│   │   ├── estado/    rotas.js
│   │   ├── avaliacoes/ (T11) · listas/ (T12) · social/ (T13–14)
│   └── test/  (espelha src/; ajudantes.js)
└── web/
    ├── package.json · vite.config.js · index.html · .env.example
    ├── public/tmdb-logo.svg
    └── src/
        ├── main.jsx · rotas.jsx · index.css
        ├── lib/  supabase.js · api.js · datas.js
        ├── auth/ AuthProvider.jsx · voltar.js · RotaProtegida.jsx · useExigirSessao.js
        ├── layout/ Layout.jsx · Cabecalho.jsx · MenuConta.jsx · Rodape.jsx
        ├── componentes/ Poster.jsx · Estados.jsx (Carregando, Vazio, Erro)
        ├── catalogo/ consultas.js · PaginaInicio.jsx · PaginaSerie.jsx · PaginaTemporada.jsx · CartaoSerie.jsx · AvisoCache.jsx
        ├── conta/    consultas.js · PaginaEntrar.jsx · PaginaMeuPerfil.jsx · PaginaPerfilPublico.jsx
        ├── diario/   consultas.js · BarraProgresso.jsx · FormularioVisualizacao.jsx · RegistrosEpisodio.jsx · PaginaDiario.jsx
        ├── sobre/PaginaSobre.jsx
        ├── avaliacoes/ (T11) · listas/ (T12) · social/ (T13–14)
        └── test/ (só funções puras)
```

Organização por funcionalidade: cada PR da Etapa 2 cria a própria pasta e encosta em poucos arquivos compartilhados (`app.js`, `rotas.jsx`, `MenuConta.jsx` e as páginas que exibem a funcionalidade).

---

## Task 0: Pré-requisitos (manual, Enzo — hoje, 25/11)

- [x] Criar o projeto no Supabase (plano free; região **Americas**, ou São Paulo se a tela permitir escolher). A senha do banco fica em `~/.config/epilog/segredos.env` (`SUPABASE_DB_PASSWORD`).
- [x] Em **Authentication → Sign In / Providers → Email**, desligar **Confirm email** (§5.7 do design).
- [x] Em **Project Settings → API Keys**, copiar a URL do projeto, a **publishable key** (`sb_publishable_…`) e a **secret key** (`sb_secret_…`).
- [x] Criar conta no TMDB e, em **Settings → API**, copiar o **API Read Access Token**.
- [x] Baixar o logo oficial do TMDB na página de logos e atribuição do TMDB e guardar para a Task 2 (`web/public/tmdb-logo.svg`).

---

# Etapa 1 — Enzo, até sex 27/11

### Task 1: Monorepo e esqueleto da API

**Arquivos:**
- Criar: `package.json`, `.gitignore`, `.prettierrc`, `eslint.config.js`, `docs/` (copiar design e plano), `api/package.json`, `api/.env.example`, `api/src/{config,erros,app,server}.js`, `api/test/{config,erros,app}.test.js`, `api/test/ajudantes.js`

**Interfaces:**
- Produz:
  - `carregarConfig(env) → { port, supabaseUrl, supabasePublishableKey, supabaseSecretKey, tmdbReadToken, corsOrigin: string|null, cacheCatalogoHoras: number }`. Lança `Error` citando cada variável obrigatória que faltar.
  - `class ErroApi extends Error { status; codigo }`, com `new ErroApi(status, codigo, mensagem)`.
  - `traduzirErroBanco(erro, mapa = {}) → ErroApi`. Mapeamento: `23505`→409 (`mapa.conflito ?? 'conflito'`), `23503`→404 (`mapa.referencia ?? 'referencia_inexistente'`), `23514`→400 `validacao`, `42501`→403 `proibido`, outros→500 `erro_banco`.
  - `tratadorDeErros(err, req, res, next)`. Mapeamento: `ZodError`→400 `validacao`, com a mensagem do 1º issue; `ErroApi`→o próprio status; `err.type === 'entity.parse.failed'`→400 `json_invalido`; outros→500 `erro_interno`, com `console.error`.
  - `criarApp({ config, clientes, catalogo }) → express.Application`. Monta `express.json()`, `cors({ origin })` só se `corsOrigin`, um router em `/api` com `GET /saude → { ok: true }`, depois 404 `rota_nao_encontrada` e `tratadorDeErros`. As tasks seguintes acrescentam routers.
  - `test/ajudantes.js`: `criarAppDeTeste(sobrescritas = {}) → app`, com config, clientes e catálogo falsos.

- [x] **Passo 1: criar a estrutura.** `git init`. `package.json` raiz com `workspaces: ["api", "web"]`, `engines`, scripts `dev` (`concurrently -n api,web "npm run dev -w api" "npm run dev -w web"`), `test` (`npm test --workspaces --if-present`), `lint` e `format`. `.gitignore`: `node_modules`, `.env`, `dist`, `supabase/.temp`. `.prettierrc`: `{ "singleQuote": true, "printWidth": 100 }`. ESLint flat config: `@eslint/js` recommended; `globals.node` para `api/`; `globals.browser` + `react-hooks` + `react-refresh` para `web/`. `api/package.json` com `"type": "module"` e os scripts `dev` (`node --env-file-if-exists=.env --watch src/server.js`), `start` (o mesmo, sem `--watch`) e `test` (`vitest run`). Dependências: `express@5 @supabase/supabase-js zod cors`. Dev: `vitest supertest`. `api/.env.example` com as variáveis do §5.2 do design.
- [x] **Passo 2: escrever os testes que falham.**

```js
// api/test/config.test.js
const base = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'pk', SUPABASE_SECRET_KEY: 'sk', TMDB_READ_TOKEN: 't' };
test('aplica padrões', () => {
  const c = carregarConfig(base);
  expect(c.port).toBe(3333); expect(c.cacheCatalogoHoras).toBe(24); expect(c.corsOrigin).toBeNull();
});
test('CACHE_CATALOGO_HORAS=0 desliga o cache', () =>
  expect(carregarConfig({ ...base, CACHE_CATALOGO_HORAS: '0' }).cacheCatalogoHoras).toBe(0));
test('acusa variável obrigatória ausente', () =>
  expect(() => carregarConfig({ ...base, TMDB_READ_TOKEN: undefined })).toThrow(/TMDB_READ_TOKEN/));

// api/test/erros.test.js
test.each([
  ['23505', 409, 'apelido_em_uso'], ['23503', 404, 'referencia_inexistente'],
  ['23514', 400, 'validacao'], ['42501', 403, 'proibido'], ['XX000', 500, 'erro_banco'],
])('traduz %s', (code, status, codigo) => {
  const e = traduzirErroBanco({ code }, { conflito: 'apelido_em_uso' });
  expect(e).toBeInstanceOf(ErroApi); expect(e.status).toBe(status); expect(e.codigo).toBe(codigo);
});

// api/test/app.test.js
test('GET /api/saude', async () => {
  const r = await request(criarAppDeTeste()).get('/api/saude');
  expect(r.status).toBe(200); expect(r.body).toEqual({ ok: true });
});
test('rota desconhecida', async () => {
  const r = await request(criarAppDeTeste()).get('/api/nao-existe');
  expect(r.status).toBe(404); expect(r.body.erro.codigo).toBe('rota_nao_encontrada');
});
test('JSON malformado', async () => {
  const r = await request(criarAppDeTeste()).post('/api/saude').set('Content-Type', 'application/json').send('{');
  expect(r.status).toBe(400); expect(r.body.erro.codigo).toBe('json_invalido');
});
```

- [x] **Passo 3:** `npm install && npm test -w api`. Esperado: FALHA (módulos não existem).
- [x] **Passo 4: implementar** `config.js`, `erros.js`, `app.js` e `test/ajudantes.js`. `server.js` faz `carregarConfig(process.env)`, chama `criarApp(...).listen(config.port)` e loga a URL. Os clientes e o catálogo entram nas Tasks 4b e 6.
- [x] **Passo 5:** `npm test -w api`. Esperado: todos PASSAM.
- [x] **Passo 6: commit.** `git add -A && git commit -m "chore: monorepo e esqueleto da API"`

### Task 2: Esqueleto do front, layout, Sobre e utilitários de data e redirecionamento

**Arquivos:**
- Criar: `web/` (`npm create vite@latest web -- --template react`), `web/vite.config.js`, `web/.env.example`, `web/public/tmdb-logo.svg`, `web/src/{main.jsx,rotas.jsx,index.css}`, `web/src/lib/{supabase,api,datas}.js`, `web/src/auth/voltar.js`, `web/src/layout/{Layout,Cabecalho,Rodape}.jsx`, `web/src/componentes/{Poster,Estados}.jsx`, `web/src/sobre/PaginaSobre.jsx`, `web/src/test/{datas,voltar}.test.js`

**Interfaces:**
- Produz:
  - `hojeLocal(agora = new Date()) → 'AAAA-MM-DD'`, usando os getters **locais**.
  - `formatarData('AAAA-MM-DD') → 'DD/MM/AAAA'`, só manipulando a string (sem `Date`).
  - `caminhoSeguro(valor) → string`: devolve `valor` só se começar com `/` e não com `//` nem `/\`; caso contrário devolve `'/'`.
  - `supabase`: cliente com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - `api(caminho, { metodo = 'GET', corpo } = {}) → Promise<any>`. Prefixa `VITE_API_URL ?? '/api'` e anexa `Authorization: Bearer` quando houver sessão (`supabase.auth.getSession()`). Para 204 devolve `null`. Se a resposta não for 2xx, lança `ErroDaApi { status, codigo, mensagem }`. Em 401 `token_invalido`, chama `supabase.auth.signOut()` antes de lançar.
  - `<Poster url nome tamanho />`: `alt="Pôster de {nome}"`, com imagem padrão quando não há `url`.
  - `<Carregando />`, `<Vazio mensagem />` e `<Erro erro aoTentarDeNovo />`, este último com o botão "Tentar de novo".
  - Tokens Tailwind em `@theme`: `--color-fundo`, `--color-superficie`, `--color-borda`, `--color-texto`, `--color-texto-suave`, `--color-destaque`, `--color-perigo`. Tema escuro; a paleta exata fica com quem constrói.

- [x] **Passo 1: configurar.** Dependências: `react-router @tanstack/react-query @supabase/supabase-js`. Dev: `tailwindcss @tailwindcss/vite vitest`. `vite.config.js`: plugins `react()` e `tailwindcss()`; `server.proxy: { '/api': 'http://localhost:3333' }`; `test: { env: { TZ: 'America/Sao_Paulo' } }`. Script `"test": "vitest run"`.
- [x] **Passo 2: escrever os testes que falham.**

```js
// web/src/test/datas.test.js
test('roda no fuso de São Paulo', () =>
  expect(new Date(2026, 10, 25, 23, 30).getTimezoneOffset()).toBe(180));
test('hojeLocal usa a data local, não UTC', () =>
  expect(hojeLocal(new Date(2026, 10, 25, 23, 30))).toBe('2026-11-25'));
test('formatarData não desloca fuso', () => expect(formatarData('2026-11-25')).toBe('25/11/2026'));

// web/src/test/voltar.test.js
test.each([
  ['/series/1399/temporadas/1', '/series/1399/temporadas/1'],
  ['https://mal.com', '/'], ['//mal.com', '/'], ['/\\mal.com', '/'], ['series', '/'], [undefined, '/'], [null, '/'],
])('caminhoSeguro(%s)', (entrada, esperado) => expect(caminhoSeguro(entrada)).toBe(esperado));
```

- [x] **Passo 3:** `npm test -w web`. Esperado: FALHA.
- [x] **Passo 4: implementar** `datas.js` e `voltar.js`. Depois `main.jsx`, com `QueryClientProvider` (queries com `staleTime: 60_000` e `retry: (n, e) => (e?.status ?? 500) >= 500 && n < 1`) e `RouterProvider`. Em seguida, `rotas.jsx` com `createBrowserRouter`: o `Layout` envolve `index` (placeholder até a Task 5), `sobre` e `*` (página não encontrada). O `Cabecalho` tem o link "EpiLog" para `/`, um campo de busca que navega para `/?q=` e o link "Entrar". O `Rodape` tem uma atribuição curta ao TMDB e o link para `/sobre`. A `PaginaSobre` traz: descrição do projeto; autores (Nivea Maria Seger e Enzo Holtz Lourenço); prof.ª Débora Cabral Nazário; OTES-02 UDESC 2026/2; logo do TMDB e o aviso exato das restrições globais. Por fim, `lib/supabase.js` e `lib/api.js`.
- [x] **Passo 5:** `npm test -w web`. Esperado: PASSA. Depois `npm run dev`: `http://localhost:5173` mostra o layout escuro e `/sobre` mostra os créditos; em 360 px de largura não há rolagem horizontal.
- [x] **Passo 6: commit.** `git add -A && git commit -m "feat(web): esqueleto, layout e página Sobre"`

### Task 3: Banco completo (esquema, RLS e funções) e script de verificação

**Arquivos:**
- Criar: `supabase/` (`npx supabase init`), `supabase/migrations/20261126000001_esquema.sql`, `…000002_rls.sql`, `…000003_funcoes.sql`, `api/scripts/verificar-banco.js`
- Modificar: `api/package.json` (script `"verificar:banco": "node --env-file=.env scripts/verificar-banco.js"`)

**Interfaces:**
- Produz (no banco, usado por todas as tasks seguintes):
  - As 10 tabelas do §5.3 do design. Chaves `bigint generated always as identity`, exceto `perfil.id uuid references auth.users on delete cascade`. **Todas as FKs com `on delete cascade`.**
  - `meu_progresso(p_temporada_id bigint default null) returns table (serie_tmdb_id int, serie_nome text, poster_path text, temporada_id bigint, temporada_numero int, assistidos int, total int, ultimo_assistido date)`. Uma linha por temporada com registro de `auth.uid()`. `assistidos` = `count(distinct episodio_id)`; `total` = número de episódios da temporada. Ordem: `ultimo_assistido desc`.
  - `listar_resenhas(p_serie_tmdb_id int default null, p_autor_apelido text default null, p_so_seguidos boolean default false, p_antes_publicado timestamptz default null, p_antes_id bigint default null, p_limite int default 20) returns table (id bigint, nota numeric, texto text, contem_spoiler boolean, publicado_em timestamptz, autor_apelido text, serie_tmdb_id int, serie_nome text, poster_path text, curtidas bigint, curti boolean)`. Sempre filtra `texto is not null`. Com `p_so_seguidos`, só autores que `auth.uid()` segue. Cursor `(publicado_em, id) < (p_antes_publicado, p_antes_id)`. Ordem `publicado_em desc, id desc`. `curti` = existe curtida de `auth.uid()`, falso para anônimo.
  - Usada por RF04 (série e perfil) e por RF06 (feed).

- [x] **Passo 1: escrever `…000001_esquema.sql`.** Restrições além das colunas do design:
  - `serie.tmdb_id` único e não nulo; `idioma_sinopse in ('pt','en')`.
  - `temporada.numero >= 0`.
  - `perfil.apelido` único, com `apelido ~ '^[a-z0-9_]{3,20}$'`.
  - `diario`: `assistido_em <= current_date`; `revisita boolean not null default false`.
  - `avaliacao`: `nota numeric(2,1)` com `nota between 0.5 and 5 and nota * 2 = trunc(nota * 2)`; `texto is null or length(texto) between 1 and 5000`; `publicado_em timestamptz` (nulo enquanto não houver texto); unique `(perfil_id, serie_id)`.
  - `lista`: `titulo` com 1 a 80 caracteres; `tipo in ('quero_assistir','personalizada')`; `visibilidade in ('publica','privada')`; `check (tipo <> 'quero_assistir' or visibilidade = 'privada')`; índice único parcial `(perfil_id) where tipo = 'quero_assistir'`.
  - `seguidor`: `check (seguidor_id <> seguido_id)`.
  - PKs compostas em `item_lista`, `seguidor` e `curtida`.
  - Índices: `diario (perfil_id, assistido_em desc, id desc)` e `avaliacao (publicado_em desc, id desc) where texto is not null`.
- [x] **Passo 2: escrever `…000002_rls.sql`.** `enable row level security` nas 10 tabelas. Usar `(select auth.uid())` nas policies, como o Supabase recomenda.
  - **Grants explícitos no começo do arquivo,** para não depender da opção "Grant API access to new tables automatically" do painel:
    - `grant usage on schema public to anon, authenticated`
    - `grant select on <as 10 tabelas> to anon, authenticated`
    - `grant insert, update, delete on diario, avaliacao, item_lista to authenticated`
    - `grant insert, delete on seguidor, curtida, lista to authenticated`
    - `grant usage on all sequences in schema public to authenticated`
    - O `grant execute` das funções fica no fim da migração 000003, porque as funções só existem depois dela.
  - Os `revoke`/`grant` por coluna de `perfil` e `lista` (tabela abaixo) vêm **depois** dos grants gerais.

| Tabela | Policies |
|---|---|
| serie, temporada, episodio | `select` para `anon, authenticated` `using (true)`. Nenhuma de escrita |
| perfil | `select` para todos `using (true)`; `update` para `authenticated` com using/check `id = uid`. `revoke update on perfil from anon, authenticated; grant update (apelido) on perfil to authenticated` |
| diario | `select/insert/update/delete` para `authenticated`, com using/check `perfil_id = uid` |
| avaliacao | `select` para todos; `insert` com check `perfil_id = uid`; `update` com using/check `perfil_id = uid`; `delete` com using `perfil_id = uid` |
| lista | `select` para todos com using `visibilidade = 'publica' or perfil_id = uid`; `insert` com check `perfil_id = uid and tipo = 'personalizada'`; `update` com using/check `perfil_id = uid`; `delete` com using `perfil_id = uid and tipo = 'personalizada'`. `revoke update on lista from anon, authenticated; grant update (titulo, visibilidade) on lista to authenticated` |
| item_lista | `select` para todos com using `exists (select 1 from lista l where l.id = lista_id)` (a RLS de `lista` vale dentro); escrita para `authenticated` com using/check `exists (… l.id = lista_id and l.perfil_id = uid)` |
| seguidor | `select` para todos; `insert` com check `seguidor_id = uid`; `delete` com using `seguidor_id = uid` |
| curtida | `select` para todos; `insert` com check `perfil_id = uid`; `delete` com using `perfil_id = uid` |

- [x] **Passo 3: escrever `…000003_funcoes.sql`.**
  - `public.criar_perfil_novo_usuario()`: `security definer`, `set search_path = ''`. Insere `perfil (id, lower(raw_user_meta_data->>'apelido'))` e `lista ('Quero assistir', 'quero_assistir', 'privada')`. Trigger `after insert on auth.users`.
  - `public.controlar_publicacao_avaliacao()`: trigger `before insert or update on avaliacao`. No insert: `publicado_em := case when texto is not null then now() end`. No update: `publicado_em := coalesce(old.publicado_em, case when new.texto is not null then now() end)` e `atualizado_em := now()`. O cliente nunca define `publicado_em`.
  - `meu_progresso` e `listar_resenhas`, como nas Interfaces, com `language sql stable security invoker`.
  - No fim do arquivo: `grant execute on function meu_progresso(bigint), listar_resenhas(int, text, boolean, timestamptz, bigint, int) to anon, authenticated`.
- [x] **Passo 4: aplicar (⛔ com OK do Enzo).** `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push`. Esperado: as 3 migrações aplicadas. Alternativa: colar os 3 arquivos, em ordem, no SQL Editor do painel.
- [x] **Passo 5: escrever `api/scripts/verificar-banco.js`.** Usa `node:assert` e supabase-js; imprime `✔ <nome>` por checagem e sai com código 1 na primeira falha. Preparação: com o cliente admin, cria os usuários `qa_a` e `qa_b` (`qa-a@example.com`/`qa-b@example.com`, `email_confirm: true`, `user_metadata.apelido`) e uma série de teste `tmdb_id = -9999` com uma temporada de 8 episódios. Cada usuário faz login num cliente anônimo próprio (`signInWithPassword`). No `finally`, apaga os dois usuários e a série -9999 (o cascade limpa o resto). Checagens:
  1. O cadastro criou `perfil.apelido = 'qa_a'` e uma lista `quero_assistir` privada.
  2. Anônimo lê `serie`; anônimo **não** insere em `serie`.
  3. A cria uma entrada no diário; B e anônimo leem **0** linhas do diário de A.
  4. A inserir no diário com `perfil_id` de B → erro.
  5. A registra o E01 **duas vezes**; `meu_progresso(temporada)` → `assistidos = 1`, `total = 8` (exemplo do resumo).
  6. `assistido_em` daqui a 2 dias → erro `23514`.
  7. Nota `0.3` → `23514`; `4.5` passa; segunda avaliação da mesma série → `23505`.
  8. Inserir com texto e `publicado_em: '2000-01-01'` → `publicado_em` ≈ agora; editar o texto não muda `publicado_em`.
  9. Lista privada de A: B e anônimo **não** veem; lista pública: os dois veem.
  10. A apagar a própria `quero_assistir` → 0 linhas afetadas; inserir lista `tipo = 'quero_assistir'` → erro; mudar a visibilidade da `quero_assistir` para pública → erro.
  11. Item repetido na mesma lista → `23505`; B inserir item na lista de A → erro.
  12. A seguir A → `23514`; A segue B; repetir → `23505`.
  13. B avalia com texto e com nota sem texto; `listar_resenhas(p_so_seguidos => true)` como A traz só a com texto.
- [x] **Passo 6:** `npm run verificar:banco -w api`. Esperado: 13 `✔` e código de saída 0.
- [x] **Passo 7: commit.** `git add -A && git commit -m "feat(banco): esquema, RLS, funções e verificação"`

### Task 4a: Cliente e mapeadores do TMDB

**Arquivos:**
- Criar: `api/src/catalogo/tmdb-cliente.js`, `api/src/catalogo/mapeadores.js`, `api/test/catalogo/{tmdb-cliente,mapeadores}.test.js`

**Interfaces:**
- Produz:
  - `criarClienteTmdb({ token, fetch = globalThis.fetch, timeoutMs = 8000 }) → { buscarSeries(q, pagina), serie(tmdbId, idioma), temporada(tmdbId, numero, idioma) }`. Devolve o JSON cru. Base `https://api.themoviedb.org/3`; `idioma` é `'pt-BR' | 'en-US'`; usa `AbortSignal.timeout`. Erros: 404 → `ErroApi(404,'nao_encontrado_no_catalogo')`; outro status não-2xx, timeout ou falha de rede → `ErroApi(502,'catalogo_indisponivel')`.
  - `urlPoster(path, tamanho = 'w342') → string|null` (`https://image.tmdb.org/t/p/{tamanho}{path}`).
  - `mapearResultadoBusca(json) → { pagina, totalPaginas, resultados: [{ tmdbId, nome, ano: number|null, posterUrl }] }`.
  - `mapearSerie(pt, en = null) → { tmdbId, nome, anoEstreia, generos: string[], sinopse, idiomaSinopse: 'pt'|'en'|null, posterPath, temporadas: [{ numero, nome, qtdEpisodios }] }`.
  - `mapearTemporada(pt, en = null) → { numero, nome, episodios: [{ numero, nome, descricao }] }`.
  - `ordenarTemporadas(lista) → lista`: crescente, com a temporada 0 por último.

- [x] **Passo 1: escrever os testes que falham.**

```js
// tmdb-cliente.test.js — fetch falso que registra as chamadas
const fetchQue = (status, corpo = {}) => vi.fn(async () => new Response(JSON.stringify(corpo), { status }));
test('busca envia query codificada, página, pt-BR, sem adulto e token', async () => {
  const fetch = fetchQue(200, { page: 1, total_pages: 1, results: [] });
  await criarClienteTmdb({ token: 'tk', fetch }).buscarSeries('the office & co', 2);
  const [url, opts] = fetch.mock.calls[0]; const u = new URL(url);
  expect(u.pathname).toBe('/3/search/tv'); expect(u.searchParams.get('query')).toBe('the office & co');
  expect(u.searchParams.get('page')).toBe('2'); expect(u.searchParams.get('language')).toBe('pt-BR');
  expect(u.searchParams.get('include_adult')).toBe('false'); expect(opts.headers.Authorization).toBe('Bearer tk');
});
test('404 vira nao_encontrado_no_catalogo', async () =>
  await expect(criarClienteTmdb({ token: 't', fetch: fetchQue(404) }).serie(999999999, 'pt-BR'))
    .rejects.toMatchObject({ status: 404, codigo: 'nao_encontrado_no_catalogo' }));
test.each([500, 429])('%i vira catalogo_indisponivel', async (s) =>
  await expect(criarClienteTmdb({ token: 't', fetch: fetchQue(s) }).serie(1, 'pt-BR'))
    .rejects.toMatchObject({ status: 502, codigo: 'catalogo_indisponivel' }));
test('falha de rede vira catalogo_indisponivel', async () =>
  await expect(criarClienteTmdb({ token: 't', fetch: vi.fn().mockRejectedValue(new TypeError('fetch failed')) }).serie(1, 'pt-BR'))
    .rejects.toMatchObject({ status: 502 }));

// mapeadores.test.js
test('resultado de busca', () => expect(mapearResultadoBusca({ page: 1, total_pages: 3, results: [
  { id: 1399, name: 'Game of Thrones', first_air_date: '2011-04-17', poster_path: '/p.jpg' },
  { id: 2, name: 'X', first_air_date: '', poster_path: null }] })).toEqual({ pagina: 1, totalPaginas: 3, resultados: [
  { tmdbId: 1399, nome: 'Game of Thrones', ano: 2011, posterUrl: 'https://image.tmdb.org/t/p/w342/p.jpg' },
  { tmdbId: 2, nome: 'X', ano: null, posterUrl: null }] }));
const pt = (o) => ({ id: 1, name: 'S', first_air_date: '2020-01-01', genres: [{ name: 'Drama' }], poster_path: null, seasons: [], ...o });
test('sinopse pt', () => expect(mapearSerie(pt({ overview: 'Texto' }))).toMatchObject({ sinopse: 'Texto', idiomaSinopse: 'pt', generos: ['Drama'], anoEstreia: 2020 }));
test('fallback en', () => expect(mapearSerie(pt({ overview: '' }), { overview: 'Text' })).toMatchObject({ sinopse: 'Text', idiomaSinopse: 'en' }));
test('sem sinopse', () => expect(mapearSerie(pt({ overview: '' }), { overview: '' })).toMatchObject({ sinopse: null, idiomaSinopse: null }));
test('Especiais por último', () => expect(mapearSerie(pt({ seasons: [
  { season_number: 0, name: 'Especiais', episode_count: 2 }, { season_number: 2, name: 'T2', episode_count: 8 },
  { season_number: 1, name: 'T1', episode_count: 8 }] })).temporadas.map((t) => t.numero)).toEqual([1, 2, 0]));
test('sem temporadas', () => expect(mapearSerie(pt({ seasons: undefined })).temporadas).toEqual([]));
test('episódio usa descrição en quando pt vazia', () => expect(mapearTemporada(
  { season_number: 1, name: 'T1', episodes: [{ episode_number: 1, name: 'Piloto', overview: 'pt' }, { episode_number: 2, name: '', overview: '' }] },
  { episodes: [{ episode_number: 2, overview: 'en' }] }).episodios).toEqual([
  { numero: 1, nome: 'Piloto', descricao: 'pt' }, { numero: 2, nome: null, descricao: 'en' }]));
```

- [x] **Passo 2:** `npm test -w api`. Esperado: FALHA.
- [x] **Passo 3: implementar** os dois módulos com as assinaturas das Interfaces (querystring via `URLSearchParams`).
- [x] **Passo 4:** `npm test -w api`. Esperado: PASSA.
- [x] **Passo 5: commit.** `git add -A && git commit -m "feat(api): cliente e mapeadores do TMDB"`

### Task 4b: Serviço de catálogo com cache no banco e rotas públicas (RF01)

**Arquivos:**
- Criar: `api/src/supabase.js`, `api/src/catalogo/{repositorio,servico,rotas}.js`, `api/test/catalogo/{servico,rotas}.test.js`
- Modificar: `api/src/app.js` (montar rotas), `api/src/server.js` (composição), `api/test/ajudantes.js`

**Interfaces:**
- Consome: Task 4a (cliente, mapeadores, `urlPoster`, `ordenarTemporadas`) e Task 1 (`ErroApi`, `traduzirErroBanco`).
- Produz:
  - `criarClientesSupabase(config) → { admin, anonimo, doUsuario(token) }`. `doUsuario` usa `createClient(url, publishableKey, { global: { headers: { Authorization: 'Bearer ' + token } }, auth: { persistSession: false, autoRefreshToken: false } })`.
  - `criarRepositorioCatalogo(admin)`, com quatro funções:
    - `buscarSerie(tmdbId) → { id, tmdbId, nome, sinopse, idiomaSinopse, anoEstreia, generos, posterPath, atualizadoEm: Date, temporadas: [{ numero, nome, qtdEpisodios }] } | null`
    - `salvarSerie(serieMapeada) → { id }`: upsert de `serie` (`onConflict: 'tmdb_id'`, `atualizado_em = now`) e de todas as `temporada` (`onConflict: 'serie_id,numero'`).
    - `buscarTemporada(serieId, numero) → { id, numero, nome, episodiosAtualizadosEm: Date|null, episodios: [{ id, numero, nome, descricao }] } | null`
    - `salvarTemporada(serieId, temporadaMapeada) → { id, episodios: [{ id, numero, nome, descricao }] }`: upsert da temporada com `qtd_episodios` e `episodios_atualizados_em = now`, e upsert dos episódios (`onConflict: 'temporada_id,numero'`).
  - `criarServicoCatalogo({ tmdb, repositorio, cacheHoras, agora = () => new Date() })`:
    - `buscar(q, pagina) → mapearResultadoBusca(...)`: vai sempre ao TMDB.
    - `obterSerie(tmdbId) → { tmdbId, nome, anoEstreia, generos, sinopse, idiomaSinopse, posterUrl (w500), temporadas, origem: 'tmdb'|'cache'|'cache_vencido' }`
    - `obterTemporada(tmdbId, numero) → { serieTmdbId, serieNome, numero, nome, episodios: [{ id, numero, nome, descricao }], origem }`
    - `estaFresco(data, horas, agora) → boolean`: falso se `horas === 0` ou se `data` for nulo.
  - `criarRotasCatalogo({ catalogo }) → Router`. Rotas `GET /series/busca`, `GET /series/:tmdbId` e `GET /series/:tmdbId/temporadas/:n`, com **`/busca` declarada antes de `/:tmdbId`**. Validação zod: `q` com trim, 1 a 100 caracteres; `pagina` inteiro de 1 a 500, padrão 1; `tmdbId` inteiro positivo; `n` inteiro ≥ 0.

Algoritmo de `obterSerie` (`obterTemporada` é análogo, usando `episodiosAtualizadosEm`; antes, ela garante a série com `buscarSerie ?? obterSerie`):
1. `linha = buscarSerie(id)`. Se `linha` existe e `estaFresco(linha.atualizadoEm)`, devolve a linha com `origem: 'cache'`.
2. Senão, consulta `tmdb.serie(id, 'pt-BR')`. Se o `overview` vier vazio, consulta também `en-US`. Mapeia, chama `salvarSerie` e devolve com `origem: 'tmdb'`.
3. Se o TMDB lançar 502 e houver `linha`, devolve a linha com `origem: 'cache_vencido'`. Qualquer outro erro (inclusive 404) é relançado.
4. Na temporada, a chamada `en-US` só acontece se algum episódio vier sem `overview`.

- [x] **Passo 1: escrever os testes de serviço que falham.** Use um `repositorio` falso, com `vi.fn`, e um `tmdb` falso. `agora` fixo em `2026-11-26T12:00:00Z` e `cacheHoras: 24`.

```js
test('sem cache: consulta TMDB, salva, origem tmdb');            // tmdb.serie chamado 1×, repositorio.salvarSerie chamado
test('cache de 1h: não chama TMDB, origem cache');                 // tmdb.serie não chamado
test('cache de 25h: chama TMDB, origem tmdb');
test('cacheHoras 0: sempre TMDB mesmo com cache de 1 min');
test('cache vencido + TMDB 502: origem cache_vencido');
test('sem cache + TMDB 502: lança 502 catalogo_indisponivel');
test('TMDB 404: lança 404 mesmo com cache vencido');
test('sinopse pt vazia: consulta en-US, idiomaSinopse en');
test('temporada de série ausente no banco: obtém a série antes (FK)');
test('temporada devolve episódios com os ids que o repositório retornou');
```

- [x] **Passo 2: escrever os testes de rota que falham** (supertest, com `catalogo` falso via `criarAppDeTeste({ catalogo })`).

```js
// beforeEach: catalogo = { buscar: vi.fn().mockResolvedValue({ pagina: 1, totalPaginas: 1, resultados: [] }),
//   obterSerie: vi.fn().mockResolvedValue({ tmdbId: 1399 }), obterTemporada: vi.fn() }; app = criarAppDeTeste({ catalogo })
test('q em branco → 400', async () => {
  const r = await request(app).get('/api/series/busca?q=%20%20');
  expect(r.status).toBe(400); expect(r.body.erro.codigo).toBe('validacao');
});
test('/series/busca não cai em /:tmdbId', async () => expect((await request(app).get('/api/series/busca?q=x')).status).toBe(200));
test('tmdbId inválido → 400', async () => expect((await request(app).get('/api/series/abc')).status).toBe(400));
test('repassa o id numérico', async () => { await request(app).get('/api/series/1399'); expect(catalogo.obterSerie).toHaveBeenCalledWith(1399); });
test('série inexistente → 404 com código', async () => {
  catalogo.obterSerie.mockRejectedValue(new ErroApi(404, 'nao_encontrado_no_catalogo', 'Série não encontrada'));
  const r = await request(app).get('/api/series/999999999');
  expect(r.status).toBe(404); expect(r.body.erro.codigo).toBe('nao_encontrado_no_catalogo');
});
```

- [x] **Passo 3:** `npm test -w api`. Esperado: FALHA.
- [x] **Passo 4: implementar** `supabase.js`, `repositorio.js`, `servico.js`, `rotas.js`; montar em `app.js`; compor em `server.js`.
- [x] **Passo 5:** `npm test -w api`. Esperado: PASSA.
- [x] **Passo 6: verificar contra os serviços reais.** Criar `api/.env` e rodar `npm run dev -w api`. Depois:
  - `curl -s 'localhost:3333/api/series/busca?q=breaking'` → resultados com `posterUrl`.
  - `curl -s localhost:3333/api/series/1396` duas vezes → `origem: "tmdb"` e depois `"cache"`.
  - `curl -s localhost:3333/api/series/1396/temporadas/1` → episódios com `id`.
  - `curl -si localhost:3333/api/series/999999999` → `404`.
- [x] **Passo 7: commit.** `git add -A && git commit -m "feat(api): catálogo com cache no banco (RF01)"`

### Task 5: Telas do catálogo (RF01)

**Arquivos:**
- Criar: `web/src/catalogo/{consultas.js,PaginaInicio.jsx,PaginaSerie.jsx,PaginaTemporada.jsx,CartaoSerie.jsx,AvisoCache.jsx}`
- Modificar: `web/src/rotas.jsx`

**Interfaces:**
- Consome: as rotas da Task 4b; `api`, `Poster` e `Estados` da Task 2.
- Produz:
  - `useBusca(q, pagina)` com a chave `['busca', q, pagina]`, habilitado só com `q`.
  - `useSerie(tmdbId)` com `['serie', tmdbId]`.
  - `useTemporada(tmdbId, n)` com `['temporada', tmdbId, n]`.
  - `<AvisoCache origem />`: só renderiza quando `origem === 'cache_vencido'`, com o texto "Não foi possível atualizar com o TMDB; mostrando dados salvos."
  - Rotas `/`, `/series/:tmdbId` e `/series/:tmdbId/temporadas/:n`.

- [x] **Passo 1: `PaginaInicio`.** Campo de busca sincronizado com `?q=` (dispara no Enter ou após 300 ms de debounce) e grade de `CartaoSerie` (pôster, nome, ano) com link para `/series/:tmdbId`. Paginação "Carregar mais" quando `pagina < totalPaginas`. Estados: vazio antes de buscar ("Busque uma série pelo título"), sem resultados, carregando e erro.
- [x] **Passo 2: `PaginaSerie`.** Pôster, nome, ano e gêneros. A sinopse ganha o selo "Sinopse em inglês" quando `idiomaSinopse === 'en'`, e mostra "Sem sinopse disponível" quando é nula. `AvisoCache` e lista de temporadas (nome e "N episódios") com link para a temporada. Erro 404 → "Série não encontrada".
- [x] **Passo 3: `PaginaTemporada`.** Cabeçalho com o link de volta para a série, o nome da série e o da temporada. Lista de episódios: número, nome ou "Episódio N", descrição ou "Sem descrição". As ações pessoais entram na Task 9.
- [x] **Passo 4: verificar** com `npm run dev`, nesta ordem:
  - Buscar "breaking" e chegar a Breaking Bad, depois a uma temporada com episódios.
  - Uma série com Especiais mostra essa temporada por último.
  - `/series/999999999` → "Série não encontrada".
  - Com `TMDB_READ_TOKEN` inválido no `.env`, a série já visitada aparece com o aviso de cache, e uma busca mostra o estado de erro.
  - Em 360 px de largura, não há rolagem horizontal.
- [x] **Passo 5: commit.** `git add -A && git commit -m "feat(web): busca, série e temporada (RF01)"`

### Task 6: Autenticação na API e rotas de perfil (RF02)

**Arquivos:**
- Criar: `api/src/middleware/auth.js`, `api/src/perfis/{esquemas,rotas}.js`, `api/test/middleware/auth.test.js`, `api/test/perfis/{esquemas,rotas}.test.js`
- Modificar: `api/src/app.js`, `api/test/ajudantes.js`

**Interfaces:**
- Consome: `criarClientesSupabase` (Task 4b) e `traduzirErroBanco` (Task 1).
- Produz:
  - `criarAuth(clientes) → { autenticacaoOpcional, exigirAutenticacao }`.
    - Sem `Authorization`: `req.usuario = null`, `req.db = clientes.anonimo`.
    - Com `Bearer <t>` válido (via `clientes.anonimo.auth.getUser(t)`): `req.usuario = { id }`, `req.db = clientes.doUsuario(t)`.
    - Header presente mas inválido, ou que não seja `Bearer`: **401 `token_invalido` em qualquer rota**.
    - `exigirAutenticacao`: 401 `nao_autenticado` se `!req.usuario`.
    - `autenticacaoOpcional` é montado no router `/api` antes de todas as rotas.
  - `apelidoSchema`: `z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, 'Use de 3 a 20 caracteres: letras sem acento, números ou _')`.
  - `criarRotasPerfis({ exigir }) → Router`:
    - `GET /perfis/disponivel?apelido=` → `{ disponivel }`.
    - `GET /perfis/:apelido` → `{ apelido, criadoEm, seguidores, seguindo, euSigo, souEu }`, ou 404 `perfil_nao_encontrado`.
    - `GET /me` → `{ id, apelido, criadoEm }`.
    - `PATCH /me { apelido }` → o mesmo formato; `23505` vira 409 `apelido_em_uso`.
  - `test/ajudantes.js`: `criarDbFalso(respostas) → { from, rpc, registro }`.
    - Todo método de query encadeia; dar `await` na cadeia resolve para `respostas[tabela]`, que pode ser um valor ou `(chamadas) => valor`. O padrão é `{ data: null, error: null }`.
    - `rpc(nome, args)` usa a chave `'rpc:' + nome`.
    - `registro` lista as chamadas como `[chave, metodo, args]`.
  - `criarAppDeTeste({ db, catalogo } = {})` (estende a versão da Task 1):
    - `db` (padrão `criarDbFalso({})`) é devolvido por `clientes.doUsuario()` e também serve de `clientes.anonimo`, junto com um `auth.getUser` falso.
    - Esse `auth.getUser` falso aceita o token `'bom'` como o usuário `'u1'` e recusa qualquer outro.

- [x] **Passo 1: escrever os testes que falham.**

```js
// esquemas.test.js
test('normaliza para minúsculas e corta espaços', () => expect(apelidoSchema.parse(' Enzo_99 ')).toBe('enzo_99'));
test.each(['ab', 'enzo lourenço', 'a'.repeat(21), 'nome-com-hifen'])('rejeita %s', (v) =>
  expect(apelidoSchema.safeParse(v).success).toBe(false));

// auth.test.js
test('rota pessoal sem token → 401 nao_autenticado', async () => {
  const r = await request(criarAppDeTeste()).get('/api/me');
  expect(r.status).toBe(401); expect(r.body.erro.codigo).toBe('nao_autenticado');
});
test.each(['Bearer ruim', 'Basic xyz'])('header %s → 401 token_invalido mesmo em rota pública', async (h) => {
  const r = await request(criarAppDeTeste()).get('/api/saude').set('Authorization', h);
  expect(r.status).toBe(401); expect(r.body.erro.codigo).toBe('token_invalido');
});

// rotas.test.js
test('PATCH /me com apelido em uso → 409', async () => {
  const db = criarDbFalso({ perfil: { data: null, error: { code: '23505' } } });
  const r = await request(criarAppDeTeste({ db })).patch('/api/me').set('Authorization', 'Bearer bom').send({ apelido: 'enzo' });
  expect(r.status).toBe(409); expect(r.body.erro.codigo).toBe('apelido_em_uso');
});
test('disponível com apelido inválido → 400', async () =>
  expect((await request(criarAppDeTeste()).get('/api/perfis/disponivel?apelido=a b')).status).toBe(400));
```

- [x] **Passo 2:** `npm test -w api`. Esperado: FALHA.
- [x] **Passo 3: implementar** `auth.js`, `esquemas.js` e `rotas.js` (usam `req.db`). Em `GET /perfis/:apelido`, as contagens vêm de `seguidor` com `count: 'exact', head: true`. Depois, montar tudo em `app.js`.
- [x] **Passo 4:** `npm test -w api`. Esperado: PASSA.
- [x] **Passo 5: commit.** `git add -A && git commit -m "feat(api): autenticação e perfis (RF02)"`

### Task 7: Conta no front (RF02)

**Arquivos:**
- Criar: `web/src/auth/{AuthProvider.jsx,RotaProtegida.jsx,useExigirSessao.js}`, `web/src/layout/MenuConta.jsx`, `web/src/conta/{consultas.js,PaginaEntrar.jsx,PaginaMeuPerfil.jsx,PaginaPerfilPublico.jsx}`
- Modificar: `web/src/main.jsx` (envolver com `AuthProvider`), `web/src/rotas.jsx`, `web/src/layout/Cabecalho.jsx`

**Interfaces:**
- Consome: as rotas da Task 6; `caminhoSeguro` e `supabase` da Task 2.
- Produz:
  - `useAuth() → { sessao, carregando, sair() }`. Usa `getSession` + `onAuthStateChange`. `sair()` limpa o cache do QueryClient.
  - `useMe()` com `['me']`, habilitado com sessão.
  - `usePerfil(apelido)` com `['perfil', apelido]`.
  - `useAtualizarApelido()`: invalida `['me']`.
  - `useExigirSessao() → () => boolean`: se não houver sessão, navega para `/entrar?voltar=<pathname+search>` e devolve `false`.
  - `<RotaProtegida>`: sem sessão, faz `<Navigate to="/entrar?voltar=…">`.
  - Rotas: `/entrar`, `/me` (protegida) e `/u/:apelido`.
  - `MenuConta`: Diário (`/me/diario`), Perfil (`/me`) e Sair. Os PRs da Etapa 2 acrescentam Minhas listas e Atividade.

- [x] **Passo 1: `AuthProvider`, `useExigirSessao`, `RotaProtegida`, `MenuConta`.** O `Cabecalho` mostra `MenuConta` (com o apelido) quando há sessão, ou "Entrar" quando não há.
- [x] **Passo 2: `PaginaEntrar`.** Duas abas, Entrar e Criar conta, controladas por `?aba=criar`.
  - Criar conta: apelido (consulta `/perfis/disponivel` ao sair do campo e mostra a regra do schema), e-mail e senha (mínimo de 6 caracteres). Chama `supabase.auth.signUp({ email, password, options: { data: { apelido } } })`.
  - Mensagens em português: "Invalid login credentials" → "E-mail ou senha incorretos"; "User already registered" → "Já existe conta com esse e-mail".
  - Depois de entrar: `navigate(caminhoSeguro(params.get('voltar')), { replace: true })`.
- [x] **Passo 3: `PaginaMeuPerfil`** (apelido editável, com a mensagem do 409; e-mail da sessão; link "Ver meu perfil público"; botão Sair) e **`PaginaPerfilPublico`** (apelido, seguidores, seguindo, "Este é você" quando `souEu`; 404 → "Perfil não encontrado").
- [x] **Passo 4: verificar.**
  - Criar a conta `teste_enzo`, sair, entrar de novo.
  - `/me` sem sessão leva a `/entrar?voltar=%2Fme` e volta para `/me` depois de entrar.
  - `/entrar?voltar=https://exemplo.com` vai para `/` depois de entrar.
  - Trocar o apelido para um já usado → mensagem de "em uso".
  - `/u/teste_enzo` abre numa aba anônima.
- [x] **Passo 5: commit.** `git add -A && git commit -m "feat(web): cadastro, login e perfis (RF02)"`

### Task 8: Diário, progresso e estado pessoal da série na API (RF03)

**Arquivos:**
- Criar: `api/src/util/paginacao.js`, `api/src/diario/{esquemas,rotas}.js`, `api/src/estado/rotas.js`, `api/test/util/paginacao.test.js`, `api/test/diario/{esquemas,rotas}.test.js`
- Modificar: `api/src/app.js`

**Interfaces:**
- Consome: `exigirAutenticacao`/`req.db`/`req.usuario` (Task 6); `urlPoster` (Task 4a); `meu_progresso` (Task 3).
- Produz:
  - `codificarCursor({ chave, id }) → string` (base64url de JSON).
  - `decodificarCursor(texto) → { chave, id }`: lança `ErroApi(400,'cursor_invalido')` se o base64 ou o JSON forem inválidos, se faltar campo ou se `id` não for inteiro.
  - Tamanho de página fixo de **20** em todas as listagens; elas devolvem `{ itens, proximoCursor: string|null }`.
  - `criarEsquemasDiario({ hoje = () => new Date() } = {}) → { novaEntrada, edicaoEntrada }`.
    - `novaEntrada`: `{ episodioId: inteiro > 0, assistidoEm: 'AAAA-MM-DD' válida e ≤ data UTC de hoje, revisita: boolean = false }`.
    - `edicaoEntrada`: os mesmos campos de data e revisita, opcionais, exigindo pelo menos um.
  - `criarRotasDiario({ exigir }) → Router`. Todas as rotas exigem sessão e sempre filtram também por `perfil_id = req.usuario.id`:
    - `GET /me/diario?antes=` → itens `{ id, assistidoEm, revisita, episodio: { id, numero, nome }, temporada: { numero }, serie: { tmdbId, nome, posterUrl } }`, ordenados por `(assistido_em, id) desc`.
    - `POST /me/diario` → 201 com o item; `23503` vira 404 `episodio_nao_encontrado`.
    - `PATCH /me/diario/:id` e `DELETE /me/diario/:id` → 404 `registro_nao_encontrado` quando nenhuma linha é afetada; o DELETE responde 204.
    - `GET /me/series/:tmdbId/temporadas/:n` → `{ assistidos, total, porEpisodio: { [episodioId]: vezes }, registros: [{ id, episodioId, assistidoEm, revisita }] }`. Quando a temporada ainda não está no banco, devolve zeros.
    - `GET /me/progresso` → `[{ serieTmdbId, serieNome, posterUrl, temporadaNumero, assistidos, total, ultimoAssistido }]`.
  - `criarRotasEstado({ exigir }) → Router`: `GET /me/series/:tmdbId/estado` → `{ avaliacao: { id, nota, texto, contemSpoiler, publicadoEm } | null, queroAssistir: { listaId, contem }, listas: [{ id, titulo, contem }] }` (`listas` = as personalizadas do usuário). É o formato do §5.5 do design, detalhado para já servir ao botão e ao seletor de listas. Quem consome são os PRs RF04 e RF05; essa rota existe já agora para os dois não disputarem o mesmo arquivo.

- [x] **Passo 1: escrever os testes que falham.**

```js
// paginacao.test.js
test('ida e volta', () => expect(decodificarCursor(codificarCursor({ chave: '2026-11-25', id: 7 }))).toEqual({ chave: '2026-11-25', id: 7 }));
test.each(['lixo', Buffer.from('{"chave":"x"}').toString('base64url'), Buffer.from('{"chave":"x","id":"1"}').toString('base64url')])(
  'cursor adulterado %s → 400', (c) => expect(() => decodificarCursor(c)).toThrow(expect.objectContaining({ status: 400, codigo: 'cursor_invalido' })));

// esquemas.test.js — 25/11 23:30 em Brasília = 26/11 02:30 UTC
const { novaEntrada, edicaoEntrada } = criarEsquemasDiario({ hoje: () => new Date('2026-11-26T02:30:00Z') });
test('aceita a data UTC de hoje (registro à noite no Brasil)', () =>
  expect(novaEntrada.parse({ episodioId: 1, assistidoEm: '2026-11-26' })).toEqual({ episodioId: 1, assistidoEm: '2026-11-26', revisita: false }));
test.each(['2026-11-27', '2026-02-30', '25/11/2026', ''])('rejeita data %s', (d) =>
  expect(novaEntrada.safeParse({ episodioId: 1, assistidoEm: d }).success).toBe(false));
test('edição exige pelo menos um campo', () => expect(edicaoEntrada.safeParse({}).success).toBe(false));

// rotas.test.js
test('GET /me/diario sem sessão → 401', async () => expect((await request(criarAppDeTeste()).get('/api/me/diario')).status).toBe(401));
test('POST /me/diario com corpo inválido → 400 sem tocar no banco', async () => {
  const db = criarDbFalso({});
  const r = await request(criarAppDeTeste({ db })).post('/api/me/diario').set('Authorization', 'Bearer bom').send({ episodioId: 'x' });
  expect(r.status).toBe(400); expect(db.registro).toHaveLength(0);
});
test('?antes=lixo → 400 cursor_invalido', async () => {
  const r = await request(criarAppDeTeste()).get('/api/me/diario?antes=lixo').set('Authorization', 'Bearer bom');
  expect(r.body.erro.codigo).toBe('cursor_invalido');
});
```

- [x] **Passo 2:** `npm test -w api`. Esperado: FALHA.
- [x] **Passo 3: implementar.** O cursor do diário em PostgREST é `.or('assistido_em.lt.${chave},and(assistido_em.eq.${chave},id.lt.${id})')`. O progresso vem de `req.db.rpc('meu_progresso', { p_temporada_id })`. Montar os dois routers em `app.js`.
- [x] **Passo 4:** `npm test -w api`. Esperado: PASSA.
- [x] **Passo 5: commit.** `git add -A && git commit -m "feat(api): diário, progresso e estado da série (RF03)"`

### Task 9: Diário no front (RF03)

**Arquivos:**
- Criar: `web/src/diario/{consultas.js,BarraProgresso.jsx,FormularioVisualizacao.jsx,RegistrosEpisodio.jsx,PaginaDiario.jsx}`
- Modificar: `web/src/catalogo/PaginaTemporada.jsx`, `web/src/catalogo/consultas.js` (acrescentar `useEstadoSerie`), `web/src/rotas.jsx`

**Interfaces:**
- Consome: as rotas da Task 8, `useExigirSessao` (Task 7) e `hojeLocal`/`formatarData` (Task 2).
- Produz:
  - Consultas: `useMeuEstadoTemporada(tmdbId, n)` com `['meu-estado-temporada', tmdbId, n]`; `useDiario()` (infinita) com `['diario']`; `useProgresso()` com `['progresso']`; `useEstadoSerie(tmdbId)` com `['estado-serie', tmdbId]`. Esta última fica para os PRs RF04 e RF05.
  - Mutações `useRegistrarVisualizacao()`, `useEditarVisualizacao()` e `useExcluirVisualizacao()`: invalidam `['meu-estado-temporada']`, `['diario']` e `['progresso']`.
  - `<BarraProgresso assistidos total />`: texto "X de Y episódios", `role="progressbar"` com `aria-valuenow`, `aria-valuemin` e `aria-valuemax`. Com `total === 0`, mostra "Sem episódios" (nada de `NaN`).
  - Rota `/me/diario` (protegida).

- [x] **Passo 1: `PaginaTemporada`.**
  - Logado: mostra `BarraProgresso` no topo e, em cada episódio, "visto N×" com o `RegistrosEpisodio` (data formatada, selo "Reassistida", editar data e revisita, excluir com confirmação).
  - Botão "Registrar": chama `exigirSessao()` e abre o `FormularioVisualizacao`. A data vem com `hojeLocal()` e `max=hojeLocal()`; a caixa "Reassistida" vem marcada quando N > 0.
  - Todo botão de mutação fica `disabled` enquanto `isPending`.
- [x] **Passo 2: `PaginaDiario`.** Seção "Em andamento", com um cartão por temporada de `useProgresso` (pôster, série, temporada e barra, com link para a temporada). Seção "Registros" com `useDiario` e "Carregar mais": data, `T{n}E{m}`, nome do episódio, série e selo de reassistida, com editar e excluir. Cada seção tem seu estado vazio.
- [x] **Passo 3: verificar, com o exemplo do resumo.**
  - Numa temporada de 8 episódios, registrar o E01 duas vezes: a temporada mostra "visto 2×" e "1 de 8 episódios", e o segundo registro já veio com "Reassistida" marcada.
  - O diário mostra as duas entradas.
  - Excluir uma entrada mantém "1 de 8"; excluir a outra zera e tira a temporada de "Em andamento".
  - Deslogado, "Registrar" leva a `/entrar` e volta para a mesma temporada.
  - Às 23h (pode simular mudando o relógio do sistema), a data padrão continua sendo hoje.
- [x] **Passo 4: commit.** `git add -A && git commit -m "feat(web): diário e progresso (RF03)"`

### Task 10: README, roteiro de verificação e GitHub

**Arquivos:**
- Criar: `README.md`, `docs/roteiro-verificacao.md`

- [x] **Passo 1: `README.md`.** Seções:
  - O que é (um parágrafo do resumo).
  - Requisitos (Node ≥ 24, as chaves do Supabase e do TMDB, que o Enzo passa em privado).
  - Configurar (copiar os dois `.env.example`).
  - Banco (`npx supabase db push`, ou o SQL Editor na ordem dos arquivos).
  - Rodar (`npm install` e `npm run dev` → `http://localhost:5173`).
  - Testes (`npm test` e `npm run verificar:banco -w api`).
  - Estrutura de pastas.
  - **Como adicionar uma funcionalidade:** seguir o diário como modelo: `api/src/diario/esquemas.js` → `rotas.js` → montar em `app.js` → `web/src/diario/consultas.js` → página → `rotas.jsx`. Nenhum PR mexe em migração sem combinar.
  - Fluxo de PR: branch `feat/<rf>-<nome>` a partir de `main`, PR para `main`, revisão da outra pessoa.
  - Créditos TMDB.
- [x] **Passo 2: `docs/roteiro-verificacao.md`.** Junta, para repetir antes da apresentação, as verificações manuais das Tasks 5, 7 e 9 e o `verificar:banco`.
- [x] **Passo 3: testar do zero.** Clonar o repositório para uma pasta temporária (`git clone . <tmp>/epilog-clone`) e rodar lá `npm ci && npm test`. Esperado: todos os testes passam num clone limpo (sem `.env`).
- [x] **Passo 4: commit.** `git add -A && git commit -m "docs: README e roteiro de verificação"`
- [ ] **Passo 5: publicar (⛔ só com OK do Enzo, que decide nome e visibilidade).** _(25/11: repositório público `ehlourenco/epilog` criado; push feito pelo Enzo; colaboradora Nivea pendente)_ `gh repo create <nome> --source . --push --<public|private>`. Depois, adicionar a Nivea como colaboradora (`gh api` ou pelo painel). Mostrar o app para ela.

---

# Etapa 2 — PRs em paralelo (Enzo + Nivea), sáb 28 a seg 30/11

Cada task é um PR: `git switch -c feat/<nome>` a partir de `main` atualizada, o ciclo de testes, `npm test` verde e o PR aberto (⛔ com OK de quem é o PR), revisado pela outra pessoa. **Nenhum destes PRs cria migração** (o banco é o da Task 3). Ordem: **T11 primeiro**. T12 e T13 podem andar em paralelo com ela. **T14 só depois do merge da T11.**

### Task 11 (PR `feat/rf04-avaliacoes`): Nota e resenha

**Arquivos:**
- Criar: `api/src/avaliacoes/{esquemas,resenhas,rotas}.js`, `api/test/avaliacoes/esquemas.test.js`, `web/src/avaliacoes/{consultas.js,PaginaAvaliacao.jsx,EntradaEstrelas.jsx,Estrelas.jsx,CartaoResenha.jsx,ListaResenhas.jsx}`
- Modificar: `api/src/app.js`, `web/src/rotas.jsx`, `web/src/catalogo/PaginaSerie.jsx`, `web/src/conta/PaginaPerfilPublico.jsx`

**Interfaces:**
- Consome: `listar_resenhas` (Task 3), paginação (Task 8), `GET /me/series/:tmdbId/estado` e `useEstadoSerie` (Tasks 8 e 9).
- Produz:
  - `avaliacaoSchema`: `{ nota: 0,5–5 em passos de 0,5, texto: string com trim até 5000 caracteres (vazia → null), contemSpoiler: boolean = false }`. Se `texto` é null, `contemSpoiler` é forçado a `false`.
  - `listarResenhas(db, { serieTmdbId?, autorApelido?, soSeguidos? }, antes?) → { itens: Resenha[], proximoCursor }`, com `Resenha = { id, nota, texto, contemSpoiler, publicadoEm, autor: { apelido }, serie: { tmdbId, nome, posterUrl }, curtidas, curti }`. A T14 reutiliza para o feed.
  - `criarRotasAvaliacoes({ exigir }) → Router`, com as rotas:
    - `PUT /me/avaliacoes/:tmdbId`: busca a avaliação existente; se existir, faz update (nota, texto, contem_spoiler); senão, insert. **Sem upsert.** Série fora do banco → 404 `serie_nao_encontrada`.
    - `DELETE /me/avaliacoes/:tmdbId` → 204, ou 404.
    - `GET /series/:tmdbId/resenhas?antes=` e `GET /perfis/:apelido/resenhas?antes=`.
  - Web: `useResenhas(filtros)` (infinita) com a chave `['resenhas', filtros]`; `<CartaoResenha resenha />` (a T14 acrescenta o botão de curtir); `<ListaResenhas filtros />`; a rota `/series/:tmdbId/avaliacao` (protegida).

- [ ] **Passo 1: escrever os testes que falham.**

```js
test('4.5 passa', () => expect(avaliacaoSchema.parse({ nota: 4.5 })).toEqual({ nota: 4.5, texto: null, contemSpoiler: false }));
test.each([0, 0.3, 4.25, 5.5])('nota %s rejeitada', (nota) => expect(avaliacaoSchema.safeParse({ nota }).success).toBe(false));
test('texto só com espaços vira null e desliga o spoiler', () =>
  expect(avaliacaoSchema.parse({ nota: 3, texto: '   ', contemSpoiler: true })).toMatchObject({ texto: null, contemSpoiler: false }));
test('texto acima de 5000 caracteres rejeitado', () => expect(avaliacaoSchema.safeParse({ nota: 3, texto: 'a'.repeat(5001) }).success).toBe(false));
```

- [ ] **Passo 2:** `npm test -w api`. Esperado: FALHA.
- [ ] **Passo 3: implementar** a API e montar em `app.js`. Rodar `npm test -w api`. Esperado: PASSA.
- [ ] **Passo 4: implementar o web.**
  - `EntradaEstrelas`: grupo de 10 radios (0,5 a 5), com `fieldset`/`legend` e uso pelo teclado.
  - `PaginaAvaliacao`: nota, texto, caixa "Contém spoiler", Salvar e Excluir. O formulário vem preenchido com a `avaliacao` do estado.
  - `CartaoResenha`: autor (link para `/u/:apelido`), série (link), estrelas, data e texto. Com spoiler, o texto fica atrás do botão "Mostrar spoiler" (`aria-expanded`). Mostra a contagem de curtidas, só para leitura.
  - `PaginaSerie`: botão "Avaliar" (com `exigirSessao`), "Sua nota" quando existir e a seção "Resenhas".
  - `PaginaPerfilPublico`: seção "Resenhas".
  - Salvar ou excluir invalida `['estado-serie', tmdbId]` e `['resenhas']`.
- [ ] **Passo 5: verificar.**
  - Dar nota 4,5 com texto e spoiler marcado: aparece na série e no perfil com o texto oculto até clicar.
  - Editar o texto: a data de publicação não muda.
  - Nota sem texto não aparece na lista de resenhas.
  - Excluir a avaliação a remove de tudo.
- [ ] **Passo 6: commit e PR.** `git commit -m "feat: nota e resenha (RF04)"`.

### Task 12 (PR `feat/rf05-listas`): Quero assistir e listas

**Arquivos:**
- Criar: `api/src/listas/{esquemas,rotas}.js`, `api/test/listas/esquemas.test.js`, `web/src/listas/{consultas.js,PaginaMinhasListas.jsx,PaginaLista.jsx,BotaoQueroAssistir.jsx,SeletorListas.jsx}`
- Modificar: `api/src/app.js`, `web/src/rotas.jsx`, `web/src/catalogo/PaginaSerie.jsx`, `web/src/conta/PaginaPerfilPublico.jsx`, `web/src/layout/MenuConta.jsx` (+ "Minhas listas")

**Interfaces:**
- Consome: o estado da série (Tasks 8 e 9), `urlPoster` e `traduzirErroBanco`.
- Produz:
  - Esquemas:
    - `novaListaSchema`: `{ titulo: trim, 1–80 caracteres; visibilidade: 'publica'|'privada' }`.
    - `edicaoListaSchema`: os mesmos campos, opcionais, com pelo menos um.
    - `ordemSchema`: `{ tmdbIds: inteiros > 0, ao menos 1, sem repetição }`.
  - `criarRotasListas({ exigir }) → Router`, com as rotas:
    - `GET /me/listas`: devolve a `quero_assistir` primeiro e cada lista com `qtdItens`.
    - `POST /me/listas` → 201.
    - `GET /listas/:id` → `{ id, titulo, tipo, visibilidade, dono: { apelido }, souDono, itens: [{ tmdbId, nome, posterUrl, ordem }] }`. Quando não existe ou é invisível para quem pede: 404 `lista_nao_encontrada`.
    - `PATCH /listas/:id` e `DELETE /listas/:id`: na `quero_assistir`, dão 400 `lista_fixa`.
    - `POST /listas/:id/itens { tmdbId }`: `ordem = max + 1`; `23505` vira 409 `serie_ja_na_lista`.
    - `DELETE /listas/:id/itens/:tmdbId`.
    - `PUT /listas/:id/ordem { tmdbIds }`: o conjunto tem de ser **exatamente** o dos itens atuais, senão 400 `ordem_invalida`. Grava `ordem` = índice.
    - `GET /perfis/:apelido/listas`: filtra **explicitamente** `visibilidade = 'publica'`, mesmo quando o dono está vendo.

- [ ] **Passo 1: escrever os testes que falham.** `novaListaSchema`: título `'  '` rejeitado; 81 caracteres rejeitado; visibilidade `'amigos'` rejeitada. `ordemSchema`: `[3, 3]` rejeitado; `[]` rejeitado.
- [ ] **Passo 2:** `npm test -w api`. Esperado: FALHA. Implementar a API. Rodar de novo. Esperado: PASSA.
- [ ] **Passo 3: implementar o web.**
  - `BotaoQueroAssistir`: alterna usando `estado.queroAssistir`, com `exigirSessao` e `disabled` enquanto a mutação roda.
  - `SeletorListas`: "Adicionar à lista", com as listas personalizadas marcadas pelo campo `contem`.
  - `PaginaMinhasListas`: Quero assistir primeiro, depois a criação de lista (título e visibilidade).
  - `PaginaLista`: itens com ↑/↓ para reordenar e remover, edição de título e visibilidade e exclusão, tudo só para o dono. A Quero assistir não oferece editar nem excluir.
  - Perfil público: seção "Listas".
  - Rotas `/me/listas` (protegida) e `/listas/:id`.
- [ ] **Passo 4: verificar.**
  - Adicionar uma série à Quero assistir pela página da série e removê-la.
  - Criar uma lista pública com 3 séries, reordenar e conferir a ordem depois de recarregar.
  - A lista pública aparece no perfil numa aba anônima; uma lista privada aberta pela URL na aba anônima dá "Lista não encontrada".
  - Adicionar a mesma série duas vezes mostra "já está na lista".
- [ ] **Passo 5: commit e PR.** `git commit -m "feat: quero assistir e listas (RF05)"`

### Task 13 (PR `feat/rf06-seguir`): Seguir perfis

**Arquivos:**
- Criar: `api/src/social/rotas.js`, `api/test/social/seguir.test.js`, `web/src/social/{consultas.js,BotaoSeguir.jsx}`
- Modificar: `api/src/app.js`, `web/src/conta/PaginaPerfilPublico.jsx`

**Interfaces:**
- Produz:
  - `criarRotasSocial({ exigir }) → Router`, com `PUT /perfis/:apelido/seguir` e `DELETE /perfis/:apelido/seguir`.
    - Os dois são **idempotentes**, sempre 204: no PUT, `23505` conta como sucesso; o DELETE não reclama quando não há linha.
    - Seguir a si mesmo → 400 `seguir_a_si_mesmo`. Perfil inexistente → 404 `perfil_nao_encontrado`.
    - A T14 acrescenta rotas neste mesmo arquivo.
  - Web: `<BotaoSeguir apelido euSigo souEu />` não renderiza quando `souEu`. Atualiza o perfil de forma otimista e invalida `['perfil', apelido]`.

- [ ] **Passo 1: escrever os testes que falham.**

```js
test('seguir duas vezes → 204 nas duas', async () => {
  const db = criarDbFalso({ perfil: { data: { id: 'u2' }, error: null }, seguidor: { data: null, error: { code: '23505' } } });
  const app = criarAppDeTeste({ db });
  for (let i = 0; i < 2; i++) expect((await request(app).put('/api/perfis/qa_b/seguir').set('Authorization', 'Bearer bom')).status).toBe(204);
});
test('seguir a si mesmo → 400', async () => {
  const db = criarDbFalso({ perfil: { data: { id: 'u1' }, error: null } });
  const r = await request(criarAppDeTeste({ db })).put('/api/perfis/eu/seguir').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(400); expect(r.body.erro.codigo).toBe('seguir_a_si_mesmo');
});
```

- [ ] **Passo 2:** FALHA. Implementar. PASSA.
- [ ] **Passo 3: verificar.** Com duas contas: A segue B pelo perfil e as contagens mudam; o duplo clique não quebra nada; deixar de seguir volta as contagens; o próprio perfil não mostra o botão.
- [ ] **Passo 4: commit e PR.** `git commit -m "feat: seguir perfis (RF06)"`

### Task 14 (PR `feat/rf06-feed`, depois do merge da T11): Curtir e feed

**Arquivos:**
- Criar: `api/test/social/curtida.test.js`, `web/src/social/{BotaoCurtir.jsx,PaginaFeed.jsx}`
- Modificar: `api/src/social/rotas.js`, `web/src/social/consultas.js`, `web/src/avaliacoes/CartaoResenha.jsx`, `web/src/rotas.jsx`, `web/src/layout/MenuConta.jsx` (+ "Atividade")

**Interfaces:**
- Consome: `listarResenhas` (T11) e `criarRotasSocial` (T13).
- Produz:
  - `PUT /avaliacoes/:id/curtida` e `DELETE /avaliacoes/:id/curtida`: idempotentes (204); avaliação inexistente (`23503`) → 404 `avaliacao_nao_encontrada`.
  - `GET /feed?antes=` → `listarResenhas(req.db, { soSeguidos: true }, antes)`.
  - Web: `<BotaoCurtir resenha />` (otimista, `aria-pressed`, `disabled` enquanto roda) dentro do `CartaoResenha`; rota `/feed` (protegida).

- [ ] **Passo 1: escrever os testes que falham.** Curtir duas vezes (curtida com `23505`) → 204 nas duas. Curtir avaliação inexistente (`23503`) → 404 `avaliacao_nao_encontrada`. `GET /api/feed` sem sessão → 401.
- [ ] **Passo 2:** FALHA. Implementar. PASSA.
- [ ] **Passo 3: `PaginaFeed`.** `ListaResenhas` com `soSeguidos`. Estado vazio: "Siga perfis para ver as resenhas deles aqui".
- [ ] **Passo 4: verificar.** A segue B; B publica uma resenha; ela aparece no topo do feed de A. A curte e a contagem sobe. Recarregar mantém o "curti". A resenha que B editar não sobe no feed.
- [ ] **Passo 5: commit e PR.** `git commit -m "feat: curtidas e feed (RF06)"`

### Task 15 (PR `feat/acabamento`, seg 30/11 – ter 01/12): Acabamento, dados de demonstração e ensaio

**Arquivos:**
- Criar: `api/scripts/dados-demo.js`, `docs/roteiro-apresentacao.md`
- Modificar: `api/package.json` (script `"dados:demo": "node --env-file=.env scripts/dados-demo.js"`) e as páginas que falharem na revisão.

- [ ] **Passo 1: revisão de acessibilidade e responsividade, página por página.** Conferir:
  - um `<h1>` por página;
  - `label` em todo campo;
  - foco visível;
  - contraste AA de `--color-texto-suave` sobre `--color-fundo` (≥ 4,5:1) e de `--color-destaque` sobre o fundo;
  - `alt` em todos os pôsteres;
  - alvos de toque ≥ 24 px;
  - 360 px sem rolagem horizontal;
  - estados de vazio e de erro (com "Tentar de novo") em todas as telas de dados.
- [ ] **Passo 2: `dados-demo.js`.** Idempotente: pula o que já existe. Usa o cliente admin e `criarServicoCatalogo` para cachear as séries 1399, 1396, 66732 e 2316. Cria `ana_series`, `bruno_tv` e `carla_maratona` (`demo-*@example.com`, senha em `DEMO_SENHA`), mais seguidores entre os três, uma resenha com texto de cada um (uma com spoiler), registros no diário e uma lista pública.
- [ ] **Passo 3: `docs/roteiro-apresentacao.md`.** A sequência segue os casos de uso da Figura 1: visitante busca → série → temporada → cria conta → registra o E01 duas vezes (1 de N) → avalia com spoiler → Quero assistir → lista pública → abre o perfil de `ana_series` → segue → feed → curte. Incluir também o checklist da véspera: reativar o Supabase, `CACHE_CATALOGO_HORAS` alto no dia, rodar `npm run verificar:banco -w api` e ensaiar a busca na rede da apresentação.
- [ ] **Passo 4 (opcional, primeiro corte):** "Em alta" no Início. `GET /series/em-alta` → TMDB `/tv/popular?language=pt-BR`, exibido quando não há `q`.
- [ ] **Passo 5:** `npm test && npm run dados:demo -w api && npm run verificar:banco -w api`. Esperado: tudo verde. Depois, um ensaio completo seguindo o roteiro.
- [ ] **Passo 6: commit e PR.** `git commit -m "chore: acabamento, dados de demonstração e roteiro"`

### Task 16 (ter 01/12, **só se** a apresentação não puder rodar local): Publicação

- [ ] **Passo 1: `web/vercel.json`** com o rewrite de SPA (`{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`).
- [ ] **Passo 2: Render (API).** Web Service com root `api`, build `npm ci`, start `npm start` e as variáveis do §5.2 do design, com `CORS_ORIGIN` igual à URL do Vercel.
- [ ] **Passo 3: Vercel (web).** Root `web`, build `npm run build`, variáveis `VITE_*` e `VITE_API_URL=https://<api>.onrender.com/api`.
- [ ] **Passo 4: verificar.** Repetir o roteiro de apresentação pela URL pública, de outro dispositivo (celular no 4G). Lembrar que o plano free do Render "dorme": abrir a API alguns minutos antes de apresentar.
- [ ] **Passo 5: commit.** `git commit -m "chore: configuração de publicação"`
