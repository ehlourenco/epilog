import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/contexto.js';
import { api } from '../lib/api.js';

export const REGRA_APELIDO = 'Use de 3 a 20 caracteres: letras sem acento, números ou _';
export const normalizarApelido = (valor) => valor.trim().toLowerCase();
export const apelidoValido = (valor) => /^[a-z0-9_]{3,20}$/.test(valor);

export function useMe() {
  const { sessao } = useAuth();
  return useQuery({ queryKey: ['me'], queryFn: () => api('/me'), enabled: Boolean(sessao) });
}

export function usePerfil(apelido) {
  return useQuery({
    queryKey: ['perfil', apelido],
    queryFn: () => api(`/perfis/${encodeURIComponent(apelido)}`),
  });
}

export function verificarApelido(apelido) {
  return api(`/perfis/disponivel?apelido=${encodeURIComponent(apelido)}`);
}

export function useAtualizarApelido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (apelido) => api('/me', { metodo: 'PATCH', corpo: { apelido } }),
    onSuccess: (perfil) => {
      queryClient.setQueryData(['me'], perfil);
      queryClient.invalidateQueries({ queryKey: ['perfil'] });
    },
  });
}
