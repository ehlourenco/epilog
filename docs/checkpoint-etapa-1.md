# Checkpoint — Etapa 1 concluída (25/11/2026)

Estado do EpiLog ao final da Etapa 1 do [plano de implementação](2026-11-25-epilog-plano-implementacao.md), antes de começarem os PRs da Etapa 2. Apresentação: **02/12/2026**.

## Entregue

| Requisito | O que funciona |
|---|---|
| **RF01 Catálogo** | Busca por título em pt-BR, com "Carregar mais". Página da série com gêneros, sinopse (selo "Sinopse em inglês" quando cai no fallback) e temporadas, com os Especiais por último. Página da temporada com os episódios. Cache do catálogo no banco (`CACHE_CATALOGO_HORAS`). Se o TMDB cai, mostra os dados salvos com aviso. Atribuição do TMDB no rodapé e na página Sobre. |
| **RF02 Conta e perfil** | Cadastro com apelido (normalizado para minúsculas e com checagem de disponibilidade), entrar e sair, volta para a página de origem depois do login (só caminhos internos), edição do apelido e perfil público `/u/:apelido`. |
| **RF03 Diário** | Registrar, editar e excluir visualizações com data. "Reassistida" já vem marcada quando o episódio tem registro anterior. Progresso por temporada (episódios distintos ÷ total). Meu diário com "Em andamento" e a lista de registros paginada. |
| **Banco** | 10 tabelas, permissões explícitas, RLS em todas e as funções `meu_progresso` e `listar_resenhas`, já aplicados no projeto Supabase compartilhado. **O esquema das funcionalidades da Etapa 2 também já existe.** |

## Como foi verificado

- `npm test`: **96 testes passando** (86 da API e 10 de funções puras do front).
- `npm run verificar:banco -w api`: **13 regras conferidas no Supabase real**. Entre elas: o diário de um usuário fica invisível para outro, a data futura é recusada, a nota vai em meia estrela, a lista privada fica protegida, a "Quero assistir" não pode ser apagada, ninguém segue a si mesmo e o feed só traz resenhas com texto.
- Roteiros das telas executados no navegador (headless) contra os serviços reais. O exemplo do resumo (E01 registrado 2× resulta em "1 de N") passou, assim como o registro às 23h30 de Brasília (a data padrão continua sendo o dia local).
- Clone limpo: `npm ci`, os testes e o build passam sem nenhum `.env`. O histórico do Git não contém chaves, tokens nem senhas.
- **Revisão independente** de todo o código da Etapa 1: nenhum problema crítico. Quatro pontos foram corrigidos (commit `2b28e3f`), cada um com teste que falhava antes:
  - uma falha de rede até o Supabase Auth não desloga mais o usuário (a API responde 503, e o front sai só da aba atual);
  - um ID acima do limite do banco na URL dá 400/"não encontrado" em vez de 500;
  - um cursor de paginação adulterado mas bem formado dá 400 em vez de 500;
  - o rodapé passou a ter o logo e o aviso oficial do TMDB, como pede o design.

## Decisões tomadas durante a implementação

| # | Decisão | Motivo |
|---|---|---|
| 1 | React Router fixado na v7 (o npm trouxe a v8) | É a versão do plano, com API conhecida; reduz o risco com o prazo curto |
| 2 | Migrações aplicadas pelo *session pooler* IPv4 (`aws-0-sa-east-1`) | O host direto do banco é só IPv6. O README explica o comando |
| 3 | Supabase CLI 3.4 usa `supabase/config.jsonc` | Só muda o nome do arquivo de configuração |
| 4 | Busca com "Carregar mais" (consulta infinita) | É o que o plano pede na tela |
| 5 | A busca do cabeçalho some na página inicial | Evita dois campos de busca iguais na mesma tela |
| 6 | `useAuth` fica em `web/src/auth/contexto.js` | Regra do ESLint (react-refresh) para arquivos de componente |
| 7 | O cursor do diário valida a chave (data que existe) e o id (inteiro seguro) | O cursor entra num filtro do PostgREST; isso fecha a injeção de filtro |
| 8 | O estado pessoal da temporada só é pedido depois que a temporada carrega | Na 1ª visita é a temporada que grava os episódios no banco |
| 9 | Commits sem linha de coautoria | Pedido do Enzo |

## Pendências conhecidas (fora da Etapa 2)

Pequenas, nenhuma bloqueia a apresentação. Podem virar PRs de acabamento (Task 15):

- [ ] O apelido `disponivel` é aceito no cadastro, mas `/perfis/disponivel` (rota da API) colide com o perfil público desse apelido. Reservar a palavra no schema.
- [ ] Criar um `errorElement` na rota raiz do front: hoje um erro inesperado mostra a tela padrão do React Router. Aproveitar para recusar caracteres de controle no parâmetro `voltar`.
- [ ] `criarApp` recebe também o cliente admin (chave secreta), embora só o catálogo o use. Passar só `{ anonimo, doUsuario }` para não facilitar o uso indevido nos PRs.
- [ ] Testes que faltam: a rota `/me/series/:tmdbId/estado`; a agregação de `/me/series/:tmdbId/temporadas/:n`; a string do filtro com cursor válido. No `verificar:banco`, faltam o caso de um usuário logado escrevendo no catálogo e o de B editando ou apagando o diário de A (o SQL já bloqueia os dois).
- [ ] "No EpiLog desde" calcula o mês em UTC. Usar a data local.
- [ ] "Em andamento" inclui temporadas completas. Filtrar `assistidos < total` ou renomear a seção para "Progresso".
- [ ] Erros de rede no login aparecem em inglês ("Failed to fetch"). Traduzir.
- [ ] Remover o `web/.oxlintrc.json`, que sobrou do template; o linter do projeto é o ESLint.
- [ ] Adicionar a Nivea como colaboradora no GitHub.

## Próximos passos — Etapa 2

Detalhados nas Tasks 11 a 16 do plano. Nenhum desses PRs cria migração.

1. **RF04 Nota e resenha** (`feat/rf04-avaliacoes`): primeiro, porque curtir e feed dependem do cartão de resenha.
2. **RF05 Listas** (`feat/rf05-listas`) e **RF06 Seguir** (`feat/rf06-seguir`): podem andar ao mesmo tempo que o RF04.
3. **RF06 Curtir e feed** (`feat/rf06-feed`): depois do merge do RF04.
4. **Acabamento** (seg 30/11 – ter 01/12): acessibilidade, estados vazios e de erro, dados de demonstração e roteiro da apresentação.
5. **Publicação** (só se a máquina da apresentação exigir): Vercel + Render.

Para começar uma funcionalidade, siga a seção "Como adicionar uma funcionalidade" do [README](../README.md), usando o diário como modelo.
