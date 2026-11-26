import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { ContextoAuth } from './contexto.js';

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((evento, nova) => {
      setSessao(nova);
      setCarregando(false);
      // Ao entrar, os dados já carregados passam a ser pedidos com o token (ex.: "eu sigo").
      // Ao sair, nada do usuário anterior pode continuar na tela.
      if (evento === 'SIGNED_IN') queryClient.invalidateQueries();
      if (evento === 'SIGNED_OUT') queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const sair = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  const valor = useMemo(() => ({ sessao, carregando, sair }), [sessao, carregando, sair]);
  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}
