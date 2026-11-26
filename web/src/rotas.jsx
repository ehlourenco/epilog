import { createBrowserRouter } from 'react-router';
import { RotaProtegida } from './auth/RotaProtegida.jsx';
import { PaginaAvaliacao } from './avaliacoes/PaginaAvaliacao.jsx';
import { PaginaInicio } from './catalogo/PaginaInicio.jsx';
import { PaginaSerie } from './catalogo/PaginaSerie.jsx';
import { PaginaTemporada } from './catalogo/PaginaTemporada.jsx';
import { PaginaEntrar } from './conta/PaginaEntrar.jsx';
import { PaginaDiario } from './diario/PaginaDiario.jsx';
import { PaginaMeuPerfil } from './conta/PaginaMeuPerfil.jsx';
import { PaginaPerfilPublico } from './conta/PaginaPerfilPublico.jsx';
import { Layout } from './layout/Layout.jsx';
import { PaginaLista } from './listas/PaginaLista.jsx';
import { PaginaMinhasListas } from './listas/PaginaMinhasListas.jsx';
import { PaginaNaoEncontrada } from './PaginaNaoEncontrada.jsx';
import { PaginaSobre } from './sobre/PaginaSobre.jsx';

export const roteador = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <PaginaInicio /> },
      { path: 'series/:tmdbId', element: <PaginaSerie /> },
      { path: 'series/:tmdbId/temporadas/:n', element: <PaginaTemporada /> },
      {
        path: 'series/:tmdbId/avaliacao',
        element: (
          <RotaProtegida>
            <PaginaAvaliacao />
          </RotaProtegida>
        ),
      },
      { path: 'entrar', element: <PaginaEntrar /> },
      {
        path: 'me',
        element: (
          <RotaProtegida>
            <PaginaMeuPerfil />
          </RotaProtegida>
        ),
      },
      {
        path: 'me/diario',
        element: (
          <RotaProtegida>
            <PaginaDiario />
          </RotaProtegida>
        ),
      },
      {
        path: 'me/listas',
        element: (
          <RotaProtegida>
            <PaginaMinhasListas />
          </RotaProtegida>
        ),
      },
      { path: 'listas/:id', element: <PaginaLista /> },
      { path: 'u/:apelido', element: <PaginaPerfilPublico /> },
      { path: 'sobre', element: <PaginaSobre /> },
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]);
