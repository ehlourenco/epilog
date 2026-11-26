-- EpiLog — esquema (Figura 2 do resumo expandido + colunas descritivas que servem de cache, Figura 6).

-- Catálogo: referências ao TMDB. Gravadas só pela API, com a chave secreta.
create table public.serie (
  id bigint generated always as identity primary key,
  tmdb_id integer not null unique,
  nome text not null,
  sinopse text,
  idioma_sinopse text check (idioma_sinopse in ('pt', 'en')),
  ano_estreia integer,
  generos text[],
  poster_path text,
  atualizado_em timestamptz not null default now()
);

create table public.temporada (
  id bigint generated always as identity primary key,
  serie_id bigint not null references public.serie (id) on delete cascade,
  numero integer not null check (numero >= 0),
  nome text,
  qtd_episodios integer,
  atualizado_em timestamptz not null default now(),
  episodios_atualizados_em timestamptz,
  unique (serie_id, numero)
);

create table public.episodio (
  id bigint generated always as identity primary key,
  temporada_id bigint not null references public.temporada (id) on delete cascade,
  numero integer not null,
  nome text,
  descricao text,
  atualizado_em timestamptz not null default now(),
  unique (temporada_id, numero)
);

-- Perfil: associado à conta do Supabase Auth. O e-mail fica em auth.users e nunca é exposto.
create table public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  apelido text not null unique check (apelido ~ '^[a-z0-9_]{3,20}$'),
  criado_em timestamptz not null default now()
);

-- Diário: uma linha por visualização (reassistir = nova linha). Privado.
create table public.diario (
  id bigint generated always as identity primary key,
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  episodio_id bigint not null references public.episodio (id) on delete cascade,
  assistido_em date not null check (assistido_em <= current_date),
  revisita boolean not null default false,
  criado_em timestamptz not null default now()
);
create index diario_perfil_data_idx on public.diario (perfil_id, assistido_em desc, id desc);
create index diario_episodio_idx on public.diario (episodio_id);

-- Avaliação: uma por perfil e série; texto (resenha) opcional. publicado_em é controlado por trigger.
create table public.avaliacao (
  id bigint generated always as identity primary key,
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  serie_id bigint not null references public.serie (id) on delete cascade,
  nota numeric(2, 1) not null check (nota between 0.5 and 5 and nota * 2 = trunc(nota * 2)),
  texto text check (texto is null or length(texto) between 1 and 5000),
  contem_spoiler boolean not null default false,
  publicado_em timestamptz,
  atualizado_em timestamptz not null default now(),
  unique (perfil_id, serie_id)
);
create index avaliacao_publicacao_idx on public.avaliacao (publicado_em desc, id desc) where texto is not null;
create index avaliacao_serie_idx on public.avaliacao (serie_id);

-- Listas: "Quero assistir" (uma por perfil, sempre privada) e listas personalizadas.
create table public.lista (
  id bigint generated always as identity primary key,
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  titulo text not null check (length(titulo) between 1 and 80),
  tipo text not null check (tipo in ('quero_assistir', 'personalizada')),
  visibilidade text not null check (visibilidade in ('publica', 'privada')),
  criada_em timestamptz not null default now(),
  check (tipo <> 'quero_assistir' or visibilidade = 'privada')
);
create unique index lista_uma_quero_assistir_idx on public.lista (perfil_id) where tipo = 'quero_assistir';

create table public.item_lista (
  lista_id bigint not null references public.lista (id) on delete cascade,
  serie_id bigint not null references public.serie (id) on delete cascade,
  ordem integer not null,
  adicionado_em timestamptz not null default now(),
  primary key (lista_id, serie_id)
);

create table public.seguidor (
  seguidor_id uuid not null references public.perfil (id) on delete cascade,
  seguido_id uuid not null references public.perfil (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  check (seguidor_id <> seguido_id)
);
create index seguidor_seguido_idx on public.seguidor (seguido_id);

create table public.curtida (
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  avaliacao_id bigint not null references public.avaliacao (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (perfil_id, avaliacao_id)
);
create index curtida_avaliacao_idx on public.curtida (avaliacao_id);
