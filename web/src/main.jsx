import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthProvider.jsx';
import './index.css';
import { roteador } from './rotas.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (falhas, erro) => (erro?.status ?? 500) >= 500 && falhas < 1,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={roteador} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
