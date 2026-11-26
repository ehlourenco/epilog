import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

// Atualiza o perfil na tela antes da resposta (otimista) e desfaz se a API recusar.
export function useSeguir(apelido) {
  const queryClient = useQueryClient();
  const chave = ['perfil', apelido];
  return useMutation({
    mutationFn: (seguir) =>
      api(`/perfis/${encodeURIComponent(apelido)}/seguir`, { metodo: seguir ? 'PUT' : 'DELETE' }),
    onMutate: async (seguir) => {
      await queryClient.cancelQueries({ queryKey: chave });
      const anterior = queryClient.getQueryData(chave);
      if (anterior && anterior.euSigo !== seguir) {
        queryClient.setQueryData(chave, {
          ...anterior,
          euSigo: seguir,
          seguidores: anterior.seguidores + (seguir ? 1 : -1),
        });
      }
      return { anterior };
    },
    onError: (_erro, _seguir, contexto) =>
      contexto?.anterior && queryClient.setQueryData(chave, contexto.anterior),
    onSettled: () => queryClient.invalidateQueries({ queryKey: chave }),
  });
}
