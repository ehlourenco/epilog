import { createContext, useContext } from 'react';

export const ContextoAuth = createContext(null);

export function useAuth() {
  const valor = useContext(ContextoAuth);
  if (!valor) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return valor;
}
