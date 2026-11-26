import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/contexto.js';
import { api } from '../lib/api.js';

export function useBusca(q) {
  return useInfiniteQuery({
    queryKey: ['busca', q],
    queryFn: ({ pageParam }) => api(`/series/busca?q=${encodeURIComponent(q)}&pagina=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (ultima) =>
      ultima.pagina < ultima.totalPaginas ? ultima.pagina + 1 : undefined,
    enabled: Boolean(q),
  });
}

export function useSerie(tmdbId) {
  return useQuery({ queryKey: ['serie', tmdbId], queryFn: () => api(`/series/${tmdbId}`) });
}

export function useTemporada(tmdbId, n) {
  return useQuery({
    queryKey: ['temporada', tmdbId, n],
    queryFn: () => api(`/series/${tmdbId}/temporadas/${n}`),
  });
}

// Estado pessoal do usuário com a série (avaliação, Quero assistir, listas). Usado pelos PRs RF04 e RF05.
export function useEstadoSerie(tmdbId) {
  const { sessao } = useAuth();
  return useQuery({
    queryKey: ['estado-serie', tmdbId],
    queryFn: () => api(`/me/series/${tmdbId}/estado`),
    enabled: Boolean(sessao),
  });
}
