import { createBrowserRouter } from 'react-router';
import { PaginaInicio } from './catalogo/PaginaInicio.jsx';
import { PaginaSerie } from './catalogo/PaginaSerie.jsx';
import { PaginaTemporada } from './catalogo/PaginaTemporada.jsx';
import { Layout } from './layout/Layout.jsx';
import { PaginaNaoEncontrada } from './PaginaNaoEncontrada.jsx';
import { PaginaSobre } from './sobre/PaginaSobre.jsx';

export const roteador = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <PaginaInicio /> },
      { path: 'series/:tmdbId', element: <PaginaSerie /> },
      { path: 'series/:tmdbId/temporadas/:n', element: <PaginaTemporada /> },
      { path: 'sobre', element: <PaginaSobre /> },
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]);
