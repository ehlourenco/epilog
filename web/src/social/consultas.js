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

// Curtir/descurtir uma resenha: ajusta na hora todas as listas de resenhas em cache e confirma com a API.
export function useCurtir() {
  const queryClient = useQueryClient();
  const alternar = (curtir, id) => (dados) =>
    dados && {
      ...dados,
      pages: dados.pages.map((pagina) => ({
        ...pagina,
        itens: pagina.itens.map((r) =>
          r.id === id && r.curti !== curtir
            ? { ...r, curti: curtir, curtidas: r.curtidas + (curtir ? 1 : -1) }
            : r,
        ),
      })),
    };
  return useMutation({
    mutationFn: ({ id, curtir }) =>
      api(`/avaliacoes/${id}/curtida`, { metodo: curtir ? 'PUT' : 'DELETE' }),
    onMutate: async ({ id, curtir }) => {
      await queryClient.cancelQueries({ queryKey: ['resenhas'] });
      queryClient.setQueriesData({ queryKey: ['resenhas'] }, alternar(curtir, id));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['resenhas'] }),
  });
}
