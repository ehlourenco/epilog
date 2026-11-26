import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export const useMinhasListas = () =>
  useQuery({ queryKey: ['minhas-listas'], queryFn: () => api('/me/listas') });

export const useLista = (id) =>
  useQuery({ queryKey: ['lista', String(id)], queryFn: () => api(`/listas/${id}`) });

export const useListasDoPerfil = (apelido) =>
  useQuery({
    queryKey: ['listas-perfil', apelido],
    queryFn: () => api(`/perfis/${encodeURIComponent(apelido)}/listas`),
  });

// Qualquer mudança em lista pode afetar: Minhas listas, a página da lista, o estado da série e o perfil.
function useMutacaoDeLista(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(
        ['minhas-listas', 'lista', 'estado-serie', 'listas-perfil'].map((chave) =>
          queryClient.invalidateQueries({ queryKey: [chave] }),
        ),
      ),
  });
}

export const useCriarLista = () =>
  useMutacaoDeLista((dados) => api('/me/listas', { metodo: 'POST', corpo: dados }));
export const useEditarLista = (id) =>
  useMutacaoDeLista((dados) => api(`/listas/${id}`, { metodo: 'PATCH', corpo: dados }));
export const useExcluirLista = (id) =>
  useMutacaoDeLista(() => api(`/listas/${id}`, { metodo: 'DELETE' }));
export const useAdicionarNaLista = () =>
  useMutacaoDeLista(({ listaId, tmdbId }) =>
    api(`/listas/${listaId}/itens`, { metodo: 'POST', corpo: { tmdbId: Number(tmdbId) } }),
  );
export const useRemoverDaLista = () =>
  useMutacaoDeLista(({ listaId, tmdbId }) =>
    api(`/listas/${listaId}/itens/${tmdbId}`, { metodo: 'DELETE' }),
  );
export const useReordenarLista = (id) =>
  useMutacaoDeLista((tmdbIds) => api(`/listas/${id}/ordem`, { metodo: 'PUT', corpo: { tmdbIds } }));
