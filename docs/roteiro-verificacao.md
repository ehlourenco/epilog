# Roteiro de verificação

Repetir antes da apresentação, com `npm run dev` rodando. Use contas de teste com e-mails `@example.com`.

## Automático

- [ ] `npm test`: todos os testes passam.
- [ ] `npm run verificar:banco -w api`: as 13 verificações passam. Elas cobrem o isolamento do diário, a data futura, a meia estrela, a lista privada, a Quero assistir, o seguir a si mesmo e o feed.

## Catálogo (RF01)

- [ ] Buscar "breaking" leva a Breaking Bad, depois a uma temporada com episódios.
- [ ] Uma série com Especiais (ex.: Game of Thrones) mostra "Especiais" por último.
- [ ] `/series/999999999` mostra "Série não encontrada".
- [ ] Com `TMDB_READ_TOKEN` inválido e `CACHE_CATALOGO_HORAS=0` na API, a série já visitada aparece com o aviso "mostrando dados salvos", e uma busca mostra o erro com "Tentar de novo".
- [ ] Em 360 px de largura, nenhuma página tem rolagem horizontal.

## Conta (RF02)

- [ ] Criar conta: um apelido em uso avisa "já está em uso"; um apelido com maiúsculas vira minúsculas.
- [ ] Sair e entrar de novo. Senha errada mostra "E-mail ou senha incorretos."
- [ ] `/me` sem sessão leva a `/entrar?voltar=%2Fme` e volta para `/me` depois de entrar.
- [ ] `/entrar?voltar=https://exemplo.com` leva para `/` depois de entrar.
- [ ] Trocar o apelido para um em uso mostra a mensagem de "em uso".
- [ ] `/u/<apelido>` abre numa aba anônima; um apelido inexistente mostra "Perfil não encontrado".

## Diário (RF03)

- [ ] Numa temporada, registrar o E01 duas vezes: aparece "Visto 2×" e "1 de N episódios", e o 2º registro já vem com "Reassistida" marcada.
- [ ] O Meu diário mostra as duas entradas e a temporada em "Em andamento".
- [ ] Excluir uma entrada mantém "1 de N"; excluir a outra tira a temporada de "Em andamento".
- [ ] Deslogado, "Registrar" leva a `/entrar` e volta para a mesma temporada.
- [ ] À noite (depois das 21h), a data padrão do registro continua sendo a de hoje.
