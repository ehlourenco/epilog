import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/contexto.js';
import { api } from '../lib/api.js';

export function useMeuEstadoTemporada(tmdbId, n, { enabled = true } = {}) {
  const { sessao } = useAuth();
  return useQuery({
    queryKey: ['meu-estado-temporada', tmdbId, n],
    queryFn: () => api(`/me/series/${tmdbId}/temporadas/${n}`),
    enabled: Boolean(sessao) && enabled,
  });
}

export function useDiario() {
  return useInfiniteQuery({
    queryKey: ['diario'],
    queryFn: ({ pageParam }) => api(pageParam ? `/me/diario?antes=${pageParam}` : '/me/diario'),
    initialPageParam: null,
    getNextPageParam: (ultima) => ultima.proximoCursor ?? undefined,
  });
}

export function useProgresso() {
  return useQuery({ queryKey: ['progresso'], queryFn: () => api('/me/progresso') });
}

function useMutacaoDoDiario(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(
        ['meu-estado-temporada', 'diario', 'progresso'].map((chave) =>
          queryClient.invalidateQueries({ queryKey: [chave] }),
        ),
      ),
  });
}

export const useRegistrarVisualizacao = () =>
  useMutacaoDoDiario((dados) => api('/me/diario', { metodo: 'POST', corpo: dados }));

export const useEditarVisualizacao = () =>
  useMutacaoDoDiario(({ id, ...dados }) =>
    api(`/me/diario/${id}`, { metodo: 'PATCH', corpo: dados }),
  );

export const useExcluirVisualizacao = () =>
  useMutacaoDoDiario((id) => api(`/me/diario/${id}`, { metodo: 'DELETE' }));
