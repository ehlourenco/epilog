export function PaginaSobre() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Sobre o EpiLog</h1>
      <p>
        O EpiLog é uma aplicação Web para quem acompanha séries de televisão. Você pesquisa séries,
        registra cada episódio assistido no seu diário, acompanha o progresso por temporada, dá
        notas e escreve resenhas, organiza listas e acompanha as resenhas dos perfis que segue.
      </p>
      <section className="space-y-1">
        <h2 className="text-xl font-semibold">Projeto</h2>
        <p>Trabalho final da disciplina de Desenvolvimento Web (OTES-02) — UDESC, 2026/2.</p>
        <p>Autores: Nivea Maria Seger e Enzo Holtz Lourenço.</p>
        <p>Professora: Débora Cabral Nazário.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Créditos do catálogo</h2>
        <img src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" className="h-6" />
        <p className="text-texto-suave">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </section>
    </article>
  );
}
