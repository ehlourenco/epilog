import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from './contexto.js';

export const caminhoDeEntrada = (location) =>
  `/entrar?voltar=${encodeURIComponent(location.pathname + location.search)}`;

// Para ações pessoais em páginas públicas: sem sessão, leva para /entrar e volta depois.
export function useExigirSessao() {
  const { sessao } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    if (sessao) return true;
    navigate(caminhoDeEntrada(location));
    return false;
  }, [sessao, navigate, location]);
}
