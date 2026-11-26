import { createBrowserRouter } from 'react-router';
import { PaginaInicio } from './catalogo/PaginaInicio.jsx';
import { Layout } from './layout/Layout.jsx';
import { PaginaNaoEncontrada } from './PaginaNaoEncontrada.jsx';
import { PaginaSobre } from './sobre/PaginaSobre.jsx';

export const roteador = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <PaginaInicio /> },
      { path: 'sobre', element: <PaginaSobre /> },
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]);
