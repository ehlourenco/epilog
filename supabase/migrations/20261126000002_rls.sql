-- EpiLog — permissões e segurança por linha (RLS).

-- 1) Grants explícitos: não dependem da opção "Grant API access to new tables automatically".
grant usage on schema public to anon, authenticated;
grant select on public.serie, public.temporada, public.episodio, public.perfil, public.diario,
  public.avaliacao, public.lista, public.item_lista, public.seguidor, public.curtida
  to anon, authenticated;
grant insert, update, delete on public.diario, public.avaliacao, public.item_lista to authenticated;
grant insert, delete on public.seguidor, public.curtida, public.lista to authenticated;
grant usage on all sequences in schema public to authenticated;

-- 2) Remove o que o painel possa ter concedido a mais.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on public.serie, public.temporada, public.episodio from anon, authenticated;
revoke insert, update, delete on public.diario, public.avaliacao, public.item_lista,
  public.seguidor, public.curtida, public.lista from anon;
revoke insert, update, delete on public.perfil from anon, authenticated;
grant update (apelido) on public.perfil to authenticated;
revoke update on public.lista from anon, authenticated;
grant update (titulo, visibilidade) on public.lista to authenticated;

-- 3) RLS em todas as tabelas.
alter table public.serie enable row level security;
alter table public.temporada enable row level security;
alter table public.episodio enable row level security;
alter table public.perfil enable row level security;
alter table public.diario enable row level security;
alter table public.avaliacao enable row level security;
alter table public.lista enable row level security;
alter table public.item_lista enable row level security;
alter table public.seguidor enable row level security;
alter table public.curtida enable row level security;

-- Catálogo: leitura pública; nenhuma policy de escrita (só a chave secreta grava).
create policy serie_leitura on public.serie for select to anon, authenticated using (true);
create policy temporada_leitura on public.temporada for select to anon, authenticated using (true);
create policy episodio_leitura on public.episodio for select to anon, authenticated using (true);

-- Perfil: público (só id e apelido); cada um edita o próprio apelido.
create policy perfil_leitura on public.perfil for select to anon, authenticated using (true);
create policy perfil_edicao on public.perfil for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Diário: só o dono lê e escreve.
create policy diario_leitura on public.diario for select to authenticated
  using (perfil_id = (select auth.uid()));
create policy diario_insercao on public.diario for insert to authenticated
  with check (perfil_id = (select auth.uid()));
create policy diario_edicao on public.diario for update to authenticated
  using (perfil_id = (select auth.uid())) with check (perfil_id = (select auth.uid()));
create policy diario_exclusao on public.diario for delete to authenticated
  using (perfil_id = (select auth.uid()));

-- Avaliação: pública para leitura; cada um mantém a própria.
create policy avaliacao_leitura on public.avaliacao for select to anon, authenticated using (true);
create policy avaliacao_insercao on public.avaliacao for insert to authenticated
  with check (perfil_id = (select auth.uid()));
create policy avaliacao_edicao on public.avaliacao for update to authenticated
  using (perfil_id = (select auth.uid())) with check (perfil_id = (select auth.uid()));
create policy avaliacao_exclusao on public.avaliacao for delete to authenticated
  using (perfil_id = (select auth.uid()));

-- Lista: pública para todos ou do próprio dono. A "Quero assistir" só nasce pelo trigger e não se apaga.
create policy lista_leitura on public.lista for select to anon, authenticated
  using (visibilidade = 'publica' or perfil_id = (select auth.uid()));
create policy lista_insercao on public.lista for insert to authenticated
  with check (perfil_id = (select auth.uid()) and tipo = 'personalizada');
create policy lista_edicao on public.lista for update to authenticated
  using (perfil_id = (select auth.uid())) with check (perfil_id = (select auth.uid()));
create policy lista_exclusao on public.lista for delete to authenticated
  using (perfil_id = (select auth.uid()) and tipo = 'personalizada');

-- Item de lista: visível se a lista é visível (a RLS de lista vale na subconsulta); escrita só do dono.
create policy item_lista_leitura on public.item_lista for select to anon, authenticated
  using (exists (select 1 from public.lista l where l.id = lista_id));
create policy item_lista_insercao on public.item_lista for insert to authenticated
  with check (exists (select 1 from public.lista l where l.id = lista_id and l.perfil_id = (select auth.uid())));
create policy item_lista_edicao on public.item_lista for update to authenticated
  using (exists (select 1 from public.lista l where l.id = lista_id and l.perfil_id = (select auth.uid())))
  with check (exists (select 1 from public.lista l where l.id = lista_id and l.perfil_id = (select auth.uid())));
create policy item_lista_exclusao on public.item_lista for delete to authenticated
  using (exists (select 1 from public.lista l where l.id = lista_id and l.perfil_id = (select auth.uid())));

-- Seguidor e curtida: públicos para leitura; cada um cria/remove os próprios.
create policy seguidor_leitura on public.seguidor for select to anon, authenticated using (true);
create policy seguidor_insercao on public.seguidor for insert to authenticated
  with check (seguidor_id = (select auth.uid()));
create policy seguidor_exclusao on public.seguidor for delete to authenticated
  using (seguidor_id = (select auth.uid()));

create policy curtida_leitura on public.curtida for select to anon, authenticated using (true);
create policy curtida_insercao on public.curtida for insert to authenticated
  with check (perfil_id = (select auth.uid()));
create policy curtida_exclusao on public.curtida for delete to authenticated
  using (perfil_id = (select auth.uid()));
