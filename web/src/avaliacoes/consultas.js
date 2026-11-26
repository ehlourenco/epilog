import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

// filtros: { serieTmdbId } | { autorApelido } | { soSeguidos } (feed).
function caminhoDasResenhas(filtros) {
  if (filtros.soSeguidos) return '/feed';
  if (filtros.serieTmdbId) return `/series/${filtros.serieTmdbId}/resenhas`;
  if (filtros.autorApelido) return `/perfis/${encodeURIComponent(filtros.autorApelido)}/resenhas`;
  throw new Error('Filtro de resenhas desconhecido');
}

export function useResenhas(filtros) {
  return useInfiniteQuery({
    queryKey: ['resenhas', filtros],
    queryFn: ({ pageParam }) =>
      api(
        pageParam
          ? `${caminhoDasResenhas(filtros)}?antes=${pageParam}`
          : caminhoDasResenhas(filtros),
      ),
    initialPageParam: null,
    getNextPageParam: (ultima) => ultima.proximoCursor ?? undefined,
  });
}

function useMutacaoDaAvaliacao(tmdbId, mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['estado-serie', String(tmdbId)] }),
        queryClient.invalidateQueries({ queryKey: ['resenhas'] }),
      ]),
  });
}

export const useSalvarAvaliacao = (tmdbId) =>
  useMutacaoDaAvaliacao(tmdbId, (dados) =>
    api(`/me/avaliacoes/${tmdbId}`, { metodo: 'PUT', corpo: dados }),
  );

export const useExcluirAvaliacao = (tmdbId) =>
  useMutacaoDaAvaliacao(tmdbId, () => api(`/me/avaliacoes/${tmdbId}`, { metodo: 'DELETE' }));
