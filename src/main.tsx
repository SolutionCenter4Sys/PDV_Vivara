/**
 * Entry point · padrão Eliza/Fourblox v2.
 *
 * Ordem (importa!):
 *   1. `reflect-metadata` ANTES de qualquer @injectable.
 *   2. setupDependencyInjection() registra todos os módulos.
 *   3. AppProvider envolve Redux + MsalProvider.
 *   4. BrowserRouter ativa rotas (TenantProvider lê params dentro).
 */
import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { setupDependencyInjection } from '@core/di/bootstrap';
import { AppProvider } from '@app/providers/AppProvider';
import App from './App';
import './index.css';

setupDependencyInjection();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>,
);
