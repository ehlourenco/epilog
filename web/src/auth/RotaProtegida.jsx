import { Navigate, useLocation } from 'react-router';
import { Carregando } from '../componentes/Estados.jsx';
import { useAuth } from './contexto.js';
import { caminhoDeEntrada } from './useExigirSessao.js';

export function RotaProtegida({ children }) {
  const { sessao, carregando } = useAuth();
  const location = useLocation();
  if (carregando) return <Carregando />;
  if (!sessao) return <Navigate to={caminhoDeEntrada(location)} replace />;
  return children;
}
