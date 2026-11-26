# EpiLog — Documento de design da implementação

**Data:** 25/11/2026 · **Autores do projeto:** Enzo Holtz Lourenço e Nivea Maria Seger · **Disciplina:** Desenvolvimento Web (UDESC), prof.ª Débora Cabral Nazário
**Fonte de verdade do produto:** `EpiLog - Resumo Expandido.docx`, entregue em 11/11/2026. **Enunciado:** `Projeto Final da Disciplina OTES_02.pdf`. Os dois estão na mesma pasta. Este documento não repete o resumo: diz **como** construir o que ele descreve e registra as decisões tomadas depois dele.

**O que o enunciado exige da implementação:** aplicação dinâmica com banco de dados, **implementar as funcionalidades descritas no projeto** (ou seja, RF01 a RF06, todos) e apresentar em aula em **02/12/2026**, "rodando localmente ou opcionalmente em um servidor remoto".

Marcação usada: **[decidido]** = escolhido pelo Enzo nesta conversa · **[documento]** = já estava no resumo expandido · **[decisão do Claude]** = escolha minha, corrigível.

---

## 1. Intenção

Implementar o EpiLog — um diário e catálogo de séries de TV inspirado no Letterboxd — como trabalho da disciplina. O diário é por **episódio** (cada visualização tem data; reassistir gera nova entrada); nota, resenha e listas são por **série**. O resumo expandido já foi entregue à professora e define requisitos (RF01–RF06), regras de negócio, modelo relacional, navegação e arquitetura. A implementação precisa **bater com o que foi entregue**: desviar da arquitetura documentada custa justificativa.

**O que é sucesso:** no dia da apresentação, rodando no computador de apresentação, uma pessoa consegue buscar uma série real, abrir temporada e episódios, criar conta, registrar episódios assistidos e ver o progresso, dar nota/resenha, montar listas e ver o feed de quem segue — com os dados pessoais protegidos.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- RF01 a RF06 do resumo expandido funcionando de ponta a ponta.
- Arquitetura da Figura 7: React + Vite → API Express → Supabase (PostgreSQL + Auth) e TMDB.
- Regras de privacidade do resumo: diário, progresso e Quero assistir privados; e-mail nunca exposto.
- Código no GitHub em condições de a Nivea clonar, rodar e contribuir por PR.

**Não-objetivos** (fora do escopo da disciplina, conforme o resumo)
- Reprodução de vídeo; comentários em resenhas; estatísticas avançadas; recomendações; importação de histórico.
- Publicação online obrigatória. O enunciado aceita rodar local; só publicamos se a máquina da apresentação exigir (§9).
- Cobertura de testes ampla.

**Anti-objetivos** (falharia mesmo "funcionando")
- Token do TMDB ou chave secreta do Supabase chegando ao navegador.
- Diário/progresso/Quero assistir de uma pessoa visíveis a outra.
- Copiar a marca ou o visual do Letterboxd (é referência funcional, não visual).
- Armazenar o catálogo do TMDB em massa (o resumo prevê consulta sob demanda; só guardamos referências).
- Arquitetura além do documentado (SSR, Docker, microserviços) — não cabe no prazo nem no texto entregue.

## 3. Restrições

- **Prazo: apresentação em 02/12/2026 (quarta)** **[enunciado]**. A partir de 26/11, são **6 dias de trabalho**.
- **Entrega:** apresentação ao vivo; possivelmente o link do repositório **[decidido]**. Por isso o README e o histórico de commits e PRs precisam estar apresentáveis.
- **Stack fixada pelo resumo** **[decidido: seguir o documento]**: JavaScript (sem TypeScript) no navegador e no servidor; React + Vite; Node.js LTS + Express (API REST); Supabase (PostgreSQL gerenciado + Supabase Auth + RLS); TMDB; Git; Postman e draw.io como apoio.
- **Node.js 26** (LTS vigente, já instalado na máquina do Enzo). Definir `"engines": { "node": ">=24" }` para a Nivea poder usar 24 ou 26.
- **Execução local** na apresentação **[documento]**; banco e TMDB exigem internet. **A máquina e a rede da apresentação ainda não estão definidas [decidido].** Por isso o código já nasce pronto para publicar (configuração só por variáveis de ambiente, CORS configurável, script de build). Se for preciso publicar, é uma tarefa curta de 01/12 (§9).
- **Planos gratuitos:** Supabase free (⚠️ projeto **pausa após ~7 dias sem uso** — retomar no painel antes da apresentação; SMTP embutido com limite baixo de e-mails); TMDB com uso não comercial e **atribuição obrigatória** (logo + aviso) **[documento]**.
- **Equipe:** o Enzo implementa sozinho a Etapa 1; depois sobe no GitHub e os dois evoluem por PRs **[decidido]**.

## 4. Abordagens consideradas

Ponto em aberto no resumo: **como a API Express acessa o Supabase** (quem grava o quê, e onde moram as regras de acesso).

| | Abordagem | Ganho | Custo |
|---|---|---|---|
| **A** ✅ | API valida o JWT e acessa o banco **como o usuário** (RLS ativa); só as tabelas de catálogo são gravadas com a chave secreta do servidor | Defesa em duas camadas; é exatamente o que o resumo descreve | Regras de acesso escritas também em SQL (policies) |
| B | API usa a chave secreta para tudo; regras só no Express | Regras num só lugar, em JS | Um esquecimento na API vaza dados; contradiz o trecho de RLS do resumo |
| C | Front fala direto com o Supabase; Express só faz proxy do TMDB | Menos código | API vira repasse; contradiz a Figura 7 ("a API aplica regras de negócio") |

**Escolhida: A** **[decidido]** — é o documento, com a lacuna da gravação do catálogo resolvida.

## 5. Decisões de construção

### 5.1 Repositório e ferramentas **[decisão do Claude, salvo indicação]**

Um repositório (monorepo com **npm workspaces**):

```
epilog/
├── package.json            # workspaces: web, api · scripts: dev (ambos), test, lint
├── README.md               # como rodar (pensado para a Nivea)
├── docs/                   # este design + plano de implementação
├── supabase/migrations/    # SQL versionado (esquema, RLS, funções, triggers)
├── api/                    # Express 5
│   ├── src/  (server.js, app.js, config.js, supabase.js, erros.js,
│   │          middleware/, tmdb/, rotas/, validacao/)
│   ├── test/
│   └── .env.example
└── web/                    # React + Vite
    ├── src/  (main.jsx, rotas.jsx, lib/, auth/, paginas/, componentes/)
    └── .env.example
```

- **API:** Express 5, `@supabase/supabase-js`, `zod` (validação), `cors`. Variáveis via `node --env-file=.env` (nativo do Node, sem dotenv). Dev com `node --watch`.
- **Web:** React 19, Vite, **Tailwind CSS v4** (`@tailwindcss/vite`) **[decidido]**, React Router (modo biblioteca), TanStack Query para dados do servidor (estados de carregando/erro/cache sem código manual), `@supabase/supabase-js` para login.
- **Dev:** proxy do Vite `/api → http://localhost:3333` (sem CORS em dev). `npm run dev` na raiz sobe os dois (`concurrently`).
- **Qualidade:** ESLint + Prettier (ajuda nas revisões de PR). Vitest nos dois pacotes.
- **Migrações:** arquivos em `supabase/migrations/` no formato do Supabase CLI, aplicados com `npx supabase db push` no projeto online compartilhado. Alternativa aceitável: colar o SQL no editor do painel, na ordem dos arquivos.
- **Idioma:** interface em pt-BR. Tabelas, colunas e rotas em português, iguais ao resumo (`perfil`, `diario`, `/me/diario`) **[decidido]**. Identificadores JS em português no domínio (`registrarVisualizacao`), inglês no genérico (`fetch`, `useQuery`).

### 5.2 Variáveis de ambiente

| Pacote | Variável | Uso |
|---|---|---|
| api | `PORT` (3333) | porta da API |
| api | `SUPABASE_URL` | projeto Supabase |
| api | `SUPABASE_PUBLISHABLE_KEY` | cliente com o JWT do usuário (RLS ativa) e cliente anônimo |
| api | `SUPABASE_SECRET_KEY` | **só** para gravar série/temporada/episódio. Nunca no front |
| api | `TMDB_READ_TOKEN` | token de leitura (Bearer) da API v3 do TMDB |
| api | `CORS_ORIGIN` | origem do front fora do proxy (ex.: publicação) |
| api | `CACHE_CATALOGO_HORAS` (24) | validade do cache do catálogo no banco; 0 desliga (§5.6) |
| web | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | login no navegador |
| web | `VITE_API_URL` | base da API (padrão `/api`, via proxy) |

`.env` fica fora do Git; `.env.example` versionado. As chaves do projeto compartilhado são passadas à Nivea em privado.

### 5.3 Modelo de dados

Segue a Figura 2 do resumo. Chaves `bigint generated always as identity`, exceto `perfil.id` (= `auth.users.id`, uuid). Datas de evento `timestamptz default now()`.

| Tabela | Colunas | Restrições |
|---|---|---|
| `serie` | id, tmdb_id, nome, sinopse?, idioma_sinopse?, ano_estreia?, generos (text[])?, poster_path?, atualizado_em | `tmdb_id` único e não nulo |
| `temporada` | id, serie_id → serie, numero, nome?, qtd_episodios?, atualizado_em, episodios_atualizados_em? | único (serie_id, numero) |
| `episodio` | id, temporada_id → temporada, numero, nome?, descricao?, atualizado_em | único (temporada_id, numero) |
| `perfil` | id → auth.users (PK), apelido, criado_em | apelido único (case-insensitive), `^[a-z0-9_]{3,20}$`, gravado em minúsculas |
| `diario` | id, perfil_id → perfil, episodio_id → episodio, assistido_em (date), revisita (bool), criado_em | `assistido_em <= current_date` |
| `avaliacao` | id, perfil_id, serie_id, nota numeric(2,1), texto?, contem_spoiler (bool, default false), publicado_em, atualizado_em | único (perfil_id, serie_id); nota entre 0,5 e 5 em passos de 0,5 |
| `lista` | id, perfil_id, titulo, tipo (`quero_assistir`\|`personalizada`), visibilidade (`publica`\|`privada`), criada_em | uma `quero_assistir` por perfil (índice único parcial); `quero_assistir` ⇒ `privada` (check) |
| `item_lista` | lista_id, serie_id, ordem, adicionado_em | PK (lista_id, serie_id) |
| `seguidor` | seguidor_id, seguido_id, criado_em | PK (seguidor_id, seguido_id); `seguidor_id <> seguido_id` |
| `curtida` | perfil_id, avaliacao_id, criado_em | PK (perfil_id, avaliacao_id) |

Deletes: apagar série/temporada não é previsto; FKs de dados pessoais com `on delete cascade` a partir de `perfil`, `avaliacao` e `lista`.

Relação com a Figura 2 **[decisão do Claude: seguir a figura, só acrescentando]**:
- **Nenhuma coluna da figura foi removida.** `diario.revisita` continua sendo coluna. O usuário marca no formulário, como o "rewatch" do Letterboxd, e o campo **já vem marcado** quando existe registro anterior do mesmo episódio. O progresso continua contando episódios distintos e não depende desse campo.
- **As colunas extras de catálogo** (`idioma_sinopse`, `ano_estreia`, `generos`, `poster_path`, `qtd_episodios`, `descricao`, `atualizado_em`) são os "campos descritivos opcionais" do resumo. Elas servem de **cache no PostgreSQL** (Figura 6, §5.6) e mantêm o diário e as listas legíveis se o TMDB cair: "a interface preserva os registros pessoais".
- **Todas as temporadas** de uma série são registradas (número, nome, quantidade de episódios) quando a página da série é aberta. Os **episódios** são registrados quando a temporada é aberta, como na Figura 6.

**Criação de perfil:** trigger `security definer` em `auth.users` (insert) cria `perfil` com o `apelido` vindo de `raw_user_meta_data` e a lista `Quero assistir` (privada). O cadastro no front envia o apelido em `options.data.apelido`.

**Derivados, sem tabela própria [documento]:**
- **Progresso por temporada** = episódios distintos no diário ÷ episódios cadastrados em `episodio` para aquela temporada. Exemplo do resumo: assistir 2× o E01 de uma temporada de 8 episódios gera 2 entradas e progresso 1/8. Implementar como função SQL `security invoker` (RLS vale).
- **Feed** = avaliações **com texto** dos perfis seguidos, por `publicado_em` desc. É paginado por cursor composto `(publicado_em, id)`, para não pular nem repetir quando dois registros têm o mesmo horário. Função SQL `security invoker`. A mesma paginação vale para o diário e para as resenhas da série.

**Regras miúdas [decisão do Claude]:**
- **`publicado_em`** é gravado na primeira vez que a avaliação recebe texto e não muda nas edições, que atualizam `atualizado_em`. Assim, editar uma resenha antiga não a joga para o topo do feed.
- **Temporada 0 (especiais do TMDB)** aparece como "Especiais", depois das temporadas numeradas, com a mesma regra de progresso.
- **Curtir a própria resenha** é permitido. O resumo só proíbe seguir a si mesmo.

### 5.4 Segurança e RLS (abordagem A)

A API monta três clientes Supabase:
1. **Usuário:** `createClient(URL, PUBLISHABLE_KEY, { global: { headers: { Authorization: 'Bearer <jwt>' } } })`, um por requisição autenticada. É o caminho padrão para **todos** os dados pessoais.
2. **Anônimo:** só com a `PUBLISHABLE_KEY`, para leituras públicas sem login.
3. **Admin (chave secreta):** usado **exclusivamente** pelo módulo de catálogo para fazer upsert em `serie`/`temporada`/`episodio`. Nenhuma rota pessoal importa esse cliente.

Middleware de auth: lê `Authorization: Bearer`, valida o token com o Supabase Auth (`auth.getClaims`/`auth.getUser` — o construtor escolhe) e põe `req.usuario = { id }` e `req.db` (cliente do usuário). Rotas `/me/*` e ações exigem token (401 sem ele); rotas públicas aceitam token opcional (para, por ex., marcar "eu curti" e "eu sigo").

| Tabela | Ler | Gravar |
|---|---|---|
| serie, temporada, episodio | todos (anon + autenticado) | ninguém via RLS (só chave secreta) |
| perfil | todos (só id e apelido existem; e-mail fica em `auth.users`, não exposto) | update do próprio |
| diario | **só o dono** | só o dono |
| avaliacao | todos | insert/update/delete do próprio |
| lista | `publica` ou do próprio dono | do próprio; não pode apagar a `quero_assistir` |
| item_lista | se a lista é legível | se a lista é do próprio |
| seguidor | todos | insert/delete onde `seguidor_id = auth.uid()` |
| curtida | todos | insert/delete onde `perfil_id = auth.uid()` |

O Express **também** valida entradas (zod) e regras (nota em meia estrela, não seguir a si mesmo, sem duplicata), devolvendo mensagens claras. O banco é a última barreira.

### 5.5 API REST

Prefixo `/api`. JSON. Erros: `{ "erro": { "codigo": "...", "mensagem": "..." } }` com 400 (validação), 401, 403, 404, 409 (apelido em uso, duplicata) e 502 (TMDB indisponível).

**Catálogo — público (RF01)**
- `GET /series/busca?q=&pagina=` → TMDB `/search/tv` (pt-BR, sem adulto). Itens: tmdbId, nome, ano, posterUrl.
- `GET /series/:tmdbId` → lê o cache do banco (§5.6). Se não houver cache ou ele estiver vencido, consulta TMDB `/tv/{id}` e faz upsert da `serie` e de todas as `temporada`s. Devolve nome, ano de estreia, gêneros, sinopse + `idiomaSinopse`, posterUrl, a lista de temporadas (número, nome, quantidade de episódios) e `origem: 'tmdb' | 'cache' | 'cache_vencido'`.
- `GET /series/:tmdbId/temporadas/:n` → mesma lógica, com TMDB `/tv/{id}/season/{n}`. Faz upsert de **todos** os `episodio`s. Devolve os episódios **com o id interno** (necessário para registrar no diário), número, nome e descrição.
- `GET /series/:tmdbId/resenhas?antes=` → resenhas públicas da série (Etapa 2, RF04).

**Conta e perfil (RF02)**
- `GET /perfis/disponivel?apelido=` → `{ disponivel }`. O front consulta antes do cadastro.
- `GET /perfis/:apelido` → perfil público: apelido, contagens de seguidores e seguidos, `euSigo` (se logado). As listas públicas e as resenhas entram pelos PRs do RF04 e RF05.
- `GET /me` · `PATCH /me { apelido }`.

**Diário e progresso (RF03)**
- `GET /me/diario?antes=` → entradas por `assistido_em` desc, com série, temporada, episódio e `reassistido`.
- `POST /me/diario { episodioId, assistidoEm }` · `PATCH /me/diario/:id { assistidoEm }` · `DELETE /me/diario/:id`.
- `GET /me/series/:tmdbId/temporadas/:n` → `{ assistidos, total, porEpisodio: { [episodioId]: vezes } }`, usado na tela da temporada.
- `GET /me/progresso` → progresso das temporadas com pelo menos um registro, usado no Meu diário.

**Nota e resenha (RF04 — Etapa 2)**
- `GET /me/series/:tmdbId/estado` → `{ avaliacao, naQueroAssistir, listasComASerie }`, para a página da série logado.
- `PUT /me/avaliacoes/:tmdbId { nota, texto?, contemSpoiler }` (upsert) · `DELETE /me/avaliacoes/:tmdbId`.

**Listas (RF05 — Etapa 2)**
- `GET /me/listas` · `POST /me/listas { titulo, visibilidade }`.
- `GET /listas/:id` (pública ou do dono) · `PATCH /listas/:id` · `DELETE /listas/:id`.
- `POST /listas/:id/itens { tmdbId }` · `DELETE /listas/:id/itens/:tmdbId` · `PUT /listas/:id/ordem { tmdbIds: [...] }`.
- Quero assistir usa as mesmas rotas, com o id da lista `quero_assistir` do usuário.

**Social (RF06 — Etapa 2)**
- `PUT|DELETE /perfis/:apelido/seguir` · `PUT|DELETE /avaliacoes/:id/curtida`.
- `GET /feed?antes=`.

**Outros:** `GET /saude`.

### 5.6 Integração com o TMDB **[documento + decisão do Claude nos detalhes]**

- API v3 (`https://api.themoviedb.org/3`), header `Authorization: Bearer ${TMDB_READ_TOKEN}`, `language=pt-BR`.
- **Fallback de idioma:** se a sinopse da série vier vazia em pt-BR, buscar `en-US` e devolver `idiomaSinopse: 'en'` (a tela mostra "sinopse em inglês"). Para episódios, só fazer **uma** chamada extra `en-US` da temporada se algum episódio vier sem descrição.
- **Imagens:** `https://image.tmdb.org/t/p/w342{poster_path}` (lista) e `w500` (ficha). Sem pôster → imagem padrão local.
- **Cache no PostgreSQL, como na Figura 6 ("consulta cache permitido, se habilitado"):** a ficha e a temporada saem das colunas descritivas do banco quando `atualizado_em` (série) ou `episodios_atualizados_em` (temporada) é mais recente que `CACHE_CATALOGO_HORAS`. Essa variável de ambiente vale 24 por padrão, e **0 desliga o cache**: é o "se habilitado" da figura e o "se os termos permitirem" do texto. A busca sempre vai ao TMDB.
- **Falha ou limite (429/5xx/timeout):** se o banco tiver dados da série ou temporada, mesmo vencidos, a API devolve esses dados com `origem: 'cache_vencido'` e a tela avisa que podem estar desatualizados. Se não tiver nada, devolve 502 com código `catalogo_indisponivel`. Nos dois casos, o diário e as listas **continuam funcionando**, porque leem só do banco.
- **Atribuição:** logo do TMDB e o aviso "This product uses the TMDB API but is not endorsed or certified by TMDB" na página Sobre e no rodapé.

### 5.7 Interface

**Rotas (Figura 3) [documento]**

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Início e busca | público |
| `/sobre` | Sobre + créditos TMDB | público |
| `/series/:tmdbId` | Página da série | público (ações exigem sessão) |
| `/series/:tmdbId/temporadas/:n` | Temporada (episódios) | público (registrar exige sessão) |
| `/u/:apelido` | Perfil público | público |
| `/entrar` | Entrar / criar conta (abas) | público |
| `/me` | Meu perfil (editar apelido) | sessão |
| `/me/diario` | Meu diário + progresso | sessão |
| `/me/listas` · `/listas/:id` | Minhas listas · detalhe (lista pública também pelo perfil) | sessão · público se pública |
| `/series/:tmdbId/avaliacao` | Nota e resenha | sessão |
| `/feed` | Meu feed | sessão |

- URL usa o **id do TMDB** (o resultado da busca ainda não existe no banco) **[decisão do Claude]**.
- **Voltar após entrar [documento]:** ação pessoal sem sessão → `/entrar?voltar=<rota atual>`. Depois do login, navegar para `voltar`, aceitando **só caminhos relativos** que começam com `/` (evita redirecionamento aberto).
- **Menu da conta [documento]:** Diário, Minhas listas, Perfil, Atividade (feed), Sair.
- **Login no navegador:** `supabase.auth.signUp/signInWithPassword/signOut`. A sessão é guardada pelo supabase-js. Cada chamada à API leva `Authorization: Bearer <access_token>`. Um contexto `AuthProvider` expõe a sessão e o perfil.
- **Confirmação de e-mail desligada** no projeto Supabase, para a demo **[decisão do Claude]**: o SMTP gratuito tem limite baixo e travaria cadastros na apresentação.

**Visual [decidido: direto no app]:** tema escuro, centrado nos pôsteres, uma cor de destaque, responsivo começando pelo celular. É uma identidade própria, não a do Letterboxd. Os ajustes são feitos olhando o app rodando.

**Componentes que importam para as regras**
- **Estrelas:** grupo de opções (radio) de 0,5 a 5, operável por teclado.
- **Spoiler:** o texto fica oculto atrás de um botão "Mostrar spoiler" (`aria-expanded`) até a ação do leitor **[documento]**.
- **Episódio:** botão "Registrar" que abre um formulário curto com a data (padrão hoje, sem datas futuras) e a caixa "Reassistida" (já marcada se houver registro anterior), além do contador "visto N×" e da lista dos registros para editar/excluir.
- **Estados:** carregando, vazio, erro do catálogo e erro de rede em todas as telas de dados.

**Acessibilidade (WCAG 2.2, citada no resumo):** HTML semântico (landmarks, títulos em ordem), `label` em todo campo, foco visível, contraste AA no tema escuro, `alt` nos pôsteres, alvos de toque ≥ 24 px.

### 5.8 Testes **[decidido: só regra de negócio]**

- **API (Vitest):** schemas zod (nota em meia estrela, apelido, data não futura); adaptador do TMDB com `fetch` simulado (mapeamento, fallback de idioma, erro → 502); middleware de auth (sem token → 401); rotas principais com supertest e camada de dados simulada.
- **Banco:** as restrições (unicidades, checks, RLS) vêm de um roteiro manual em `docs/roteiro-verificacao.md`. São consultas SQL e chamadas com dois usuários de teste provando que A não lê o diário de B.
- **Web:** sem testes automatizados. A verificação é manual, guiada pelo roteiro.

## 6. Etapas de entrega

### Etapa 1 — Enzo, antes de subir no GitHub **[decidido]**
1. **Fundação:** monorepo, ferramentas, projeto Supabase e **esquema completo** (as 10 tabelas, RLS, trigger e funções, incluindo as do RF04–RF06) **[decisão do Claude]**. Assim os PRs paralelos da Etapa 2 não disputam migrações. Também o layout base (cabeçalho com busca, menu, rodapé com a atribuição do TMDB) e a página Sobre.
2. **RF01 Catálogo:** busca, página da série e temporada com episódios.
3. **RF02 Conta:** cadastro com apelido, entrar, sair, editar apelido, perfil público básico e o "voltar após entrar".
4. **RF03 Diário:** registrar, editar e excluir visualizações; reassistidas; progresso na temporada e no Meu diário.
5. README para a Nivea, criação do repositório no GitHub e push.

### Etapa 2 — PRs em paralelo (Enzo e Nivea)

A divisão de quem pega o quê fica para quando a Etapa 1 estiver no GitHub **[decidido]**. O plano a deixa fácil assim **[decisão do Claude]**:
- **Nenhum PR da Etapa 2 mexe em esquema ou RLS,** porque tudo já foi feito na Etapa 1. Ninguém precisa saber escrever policies, e os PRs são só API + tela.
- **O fluxo do diário (RF03) é o exemplo a seguir.** Ele passa por rota Express, schema zod, teste, hook do TanStack Query e página. O README tem uma seção "como adicionar uma funcionalidade", apontando para esses arquivos.
- **O RF04 tem prioridade,** porque curtir e feed (RF06) usam o cartão de resenha dele. O RF05 e o "seguir" do RF06 não dependem de nada e podem andar ao mesmo tempo.

- **PR RF04 Nota e resenha:** tela de avaliação, resenhas na página da série e no perfil público, spoiler.
- **PR RF05 Listas:** Quero assistir (botão na página da série) e listas personalizadas (CRUD, visibilidade, ordenar), listas públicas no perfil.
- **PR RF06 Social:** seguir/deixar de seguir pode começar já; **curtir e feed dependem do PR RF04** (usam o cartão de resenha).
- **PR Acabamento:** acessibilidade, estados vazio/erro, responsividade e um script de dados de demonstração (2–3 contas com seguidores e resenhas, para o feed não aparecer vazio na apresentação).
- **Publicação (só se for preciso) [decidido]:** front no Vercel e API no Render, ambos gratuitos. Só acontece se a apresentação não for no notebook do Enzo ou se a rede da UDESC bloquear o Supabase/TMDB.

**Cronograma [decisão do Claude, sobre a data do enunciado]:**

| Dia | O quê |
|---|---|
| qua 25/11 (hoje) | Design e plano aprovados. Criar o projeto Supabase e pegar o token de leitura do TMDB |
| qui 26/11 | Fundação (monorepo, esquema completo + RLS, layout, Sobre) + RF01 catálogo |
| sex 27/11 | RF02 conta + RF03 diário + README. **Subir no GitHub e mostrar para a Nivea** |
| sáb 28 – seg 30/11 | Etapa 2 em paralelo: RF04 primeiro, depois curtir/feed (RF06); RF05 e "seguir" ao mesmo tempo |
| ter 01/12 | Acabamento, dados de demonstração, **ensaio completo**, decidir entre local e publicado (publicar nesse dia, se for preciso), reativar o Supabase |
| qua 02/12 | Apresentação |

⚠️ Com 6 dias, a Nivea só tem sáb–seg se a Etapa 1 chegar ao GitHub na sexta. Se a Etapa 1 atrasar, vale chamar a Nivea antes, com o RF05 (listas), que só depende do esquema.

**Ordem de corte se o prazo apertar [decisão do Claude]:** primeiro sai o que não é requisito, depois o acabamento, e os RFs ficam por último. O enunciado exige todos os RFs:
1. "Em alta" no Início.
2. Script de demonstração: as contas de demonstração passam a ser criadas à mão.
3. Acabamento além do básico de acessibilidade.
4. Arrastar para ordenar listas: já começa com botões ↑/↓, e arrastar só entra se sobrar tempo.

A publicação não entra nessa lista. Ela depende da máquina da apresentação, não de tempo.

Nenhum RF é cortado.

## 7. Riscos

| Risco | Mitigação |
|---|---|
| Supabase free pausado no dia | Abrir o painel na véspera; ensaio no dia anterior |
| Máquina/rede da apresentação indefinidas | Código pronto para publicar desde o início; se possível, testar o acesso ao Supabase e ao TMDB pela rede da UDESC antes de 01/12; publicar em 01/12 se for preciso |
| Prazo de 6 dias | Esquema completo no 1º dia; RF04 com prioridade; ordem de corte sem nenhum RF |
| Internet ruim na apresentação | O cache fica no banco, então o ensaio deixa as séries da demo já em cache (com `CACHE_CATALOGO_HORAS` alto no dia); ter o celular como roteador |
| SMTP gratuito trava cadastros | Confirmação de e-mail desligada (§5.7) |
| Chave secreta vazar no front | Só existe em `api/.env`; o cliente admin fica num módulo usado só pelo catálogo |
| Migrações divergentes entre os dois | Esquema completo na Etapa 1; mudança de esquema = arquivo novo de migração via PR |
| TMDB limita chamadas | Cache no banco e busca disparada no Enter ou com debounce de 300 ms |

## 8. Deixado para quem constrói

- Divisão interna em componentes, nomes de arquivos dentro das pastas e utilitários.
- Tamanhos de página e textos de mensagens.
- `auth.getClaims` vs `auth.getUser` no middleware.
- Se o Início mostra também "séries em alta" (TMDB `/tv/popular`) além da busca: opcional, se for barato.
- Paleta exata e tipografia, dentro do tema escuro.
- Coleção do Postman ou arquivos `.http` para as rotas (o resumo cita o Postman como opcional).

## 9. Publicação (se for preciso)

Só acontece se a apresentação não puder rodar local no notebook do Enzo (§3). O enunciado aceita as duas formas. O front vai para o Vercel, com `VITE_API_URL` apontando para a API, e a API para o Render, com `CORS_ORIGIN` igual à URL do Vercel. As variáveis ficam nos painéis, nunca no Git. A apresentação continua podendo ser local.
