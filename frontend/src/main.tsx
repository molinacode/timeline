import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './app/providers/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

import './styles.css';

// Si una petición con token recibe 401, avisar para cerrar sesión y redirigir a login
const originalFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  return originalFetch(input, init).then((res) => {
    if (res.status === 401) {
      const auth =
        (init?.headers && (init.headers as Record<string, string>)?.Authorization) ||
        (init?.headers && (init.headers as Headers).get?.('Authorization'));
      if (auth) {
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }
    return res;
  });
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

