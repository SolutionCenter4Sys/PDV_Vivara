import { type ReactNode, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { container } from '@core/di/container';
import { CoreTokens } from '@core/di/tokens/core.tokens';
import type { MsalService } from '@core/auth/MsalService';
import { msalConfig, msalConfigured } from '@core/auth/msalConfig';
import { store } from '@app/store/store';

/**
 * AppProvider · padrão Eliza/Fourblox (Redux + Msal + Tooltip).
 *
 * - Redux Provider envolve TUDO (selectors disponíveis em qualquer subárvore).
 * - MsalProvider só fica ATIVO quando `msalConfigured === true`. Caso contrário
 *   um wrapper noop é renderizado e o LoginPage usa fallback PIN.
 * - Inicializa MSAL via DI (MsalService) na primeira render.
 */
interface Props {
  children: ReactNode;
}

const msalInstance = msalConfigured ? new PublicClientApplication(msalConfig) : null;

export function AppProvider({ children }: Props) {
  useEffect(() => {
    const msal = container.resolve<MsalService>(CoreTokens.MsalService);
    msal.initialize().catch(() => {
      /* dormente · sem MSAL · fallback PIN ativo */
    });
  }, []);

  const tree = (
    <ReduxProvider store={store}>{children}</ReduxProvider>
  );

  if (msalInstance) {
    return <MsalProvider instance={msalInstance}>{tree}</MsalProvider>;
  }
  return tree;
}
