-- EpiLog — triggers e funções (progresso e resenhas são derivados, sem tabela própria).

-- Novo usuário no Supabase Auth → perfil com o apelido do cadastro + lista "Quero assistir".
create function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfil (id, apelido)
  values (new.id, lower(new.raw_user_meta_data ->> 'apelido'));
  insert into public.lista (perfil_id, titulo, tipo, visibilidade)
  values (new.id, 'Quero assistir', 'quero_assistir', 'privada');
  return new;
end;
$$;
revoke execute on function public.criar_perfil_novo_usuario() from public, anon, authenticated;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- publicado_em: gravado quando a avaliação ganha texto pela primeira vez e nunca muda depois.
-- Editar uma resenha antiga não a joga para o topo do feed. O cliente não consegue definir o valor.
create function public.controlar_publicacao_avaliacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.publicado_em := case when new.texto is not null then now() end;
  else
    new.publicado_em := coalesce(old.publicado_em, case when new.texto is not null then now() end);
    new.atualizado_em := now();
  end if;
  return new;
end;
$$;

create trigger avaliacao_publicacao
  before insert or update on public.avaliacao
  for each row execute function public.controlar_publicacao_avaliacao();

-- Progresso por temporada do usuário logado: episódios distintos ÷ episódios da temporada.
create function public.meu_progresso(p_temporada_id bigint default null)
returns table (
  serie_tmdb_id integer,
  serie_nome text,
  poster_path text,
  temporada_id bigint,
  temporada_numero integer,
  assistidos integer,
  total integer,
  ultimo_assistido date
)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.tmdb_id,
         s.nome,
         s.poster_path,
         t.id,
         t.numero,
         count(distinct d.episodio_id)::integer,
         (select count(*) from public.episodio e2 where e2.temporada_id = t.id)::integer,
         max(d.assistido_em)
  from public.diario d
  join public.episodio e on e.id = d.episodio_id
  join public.temporada t on t.id = e.temporada_id
  join public.serie s on s.id = t.serie_id
  where d.perfil_id = (select auth.uid())
    and (p_temporada_id is null or t.id = p_temporada_id)
  group by s.id, t.id
  order by max(d.assistido_em) desc, t.id desc;
$$;

-- Resenhas (avaliações com texto): por série, por autor ou dos perfis seguidos (feed).
-- Paginação por cursor composto (publicado_em, id).
create function public.listar_resenhas(
  p_serie_tmdb_id integer default null,
  p_autor_apelido text default null,
  p_so_seguidos boolean default false,
  p_antes_publicado timestamptz default null,
  p_antes_id bigint default null,
  p_limite integer default 20
)
returns table (
  id bigint,
  nota numeric,
  texto text,
  contem_spoiler boolean,
  publicado_em timestamptz,
  autor_apelido text,
  serie_tmdb_id integer,
  serie_nome text,
  poster_path text,
  curtidas bigint,
  curti boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select a.id,
         a.nota,
         a.texto,
         a.contem_spoiler,
         a.publicado_em,
         p.apelido,
         s.tmdb_id,
         s.nome,
         s.poster_path,
         (select count(*) from public.curtida c where c.avaliacao_id = a.id),
         exists (
           select 1 from public.curtida c
           where c.avaliacao_id = a.id and c.perfil_id = (select auth.uid())
         )
  from public.avaliacao a
  join public.perfil p on p.id = a.perfil_id
  join public.serie s on s.id = a.serie_id
  where a.texto is not null
    and (p_serie_tmdb_id is null or s.tmdb_id = p_serie_tmdb_id)
    and (p_autor_apelido is null or p.apelido = lower(p_autor_apelido))
    and (not p_so_seguidos or a.perfil_id in (
      select g.seguido_id from public.seguidor g where g.seguidor_id = (select auth.uid())
    ))
    and (p_antes_publicado is null or (a.publicado_em, a.id) < (p_antes_publicado, p_antes_id))
  order by a.publicado_em desc, a.id desc
  limit least(greatest(p_limite, 1), 50);
$$;

grant execute on function public.meu_progresso(bigint),
  public.listar_resenhas(integer, text, boolean, timestamptz, bigint, integer)
  to anon, authenticated;
