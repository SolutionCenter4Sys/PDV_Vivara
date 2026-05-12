import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import type { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { injectable } from 'tsyringe';
import { msalConfig, msalConfigured, loginRequest } from './msalConfig';

/**
 * Wrapper MSAL · padrão Fourmakers v2.
 *
 * - SSO Microsoft via @azure/msal-browser quando configurado.
 * - Fallback dormente quando vars de env não definidas (DEV/MVP):
 *   isEnabled() === false → LoginPage usa PIN.
 * - getToken() é o `accessTokenFactory` consumido pelo httpClient.
 */
@injectable()
export class MsalService {
  private app: PublicClientApplication | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (!msalConfigured || this.initialized) return;
    this.app = new PublicClientApplication(msalConfig);
    await this.app.initialize();
    this.initialized = true;
  }

  isEnabled(): boolean {
    return msalConfigured && this.initialized && this.app !== null;
  }

  getActiveAccount(): AccountInfo | null {
    if (!this.app) return null;
    return this.app.getActiveAccount() ?? this.app.getAllAccounts()[0] ?? null;
  }

  async loginPopup(): Promise<AuthenticationResult | null> {
    if (!this.app) {
      throw new Error(
        'MSAL não configurado · defina VITE_MSAL_TENANT_ID e VITE_MSAL_CLIENT_ID em .env.local',
      );
    }
    const result = await this.app.loginPopup(loginRequest);
    this.app.setActiveAccount(result.account);
    return result;
  }

  async logout(): Promise<void> {
    if (!this.app) return;
    await this.app.logoutPopup({ account: this.getActiveAccount() ?? undefined });
  }

  /**
   * Token de acesso para o httpClient.
   * Faz acquireTokenSilent + fallback popup quando consent expira.
   */
  async getToken(): Promise<string | null> {
    if (!this.app) return null;
    const account = this.getActiveAccount();
    if (!account) return null;

    try {
      const result = await this.app.acquireTokenSilent({ ...loginRequest, account });
      return result.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        const result = await this.app.acquireTokenPopup({ ...loginRequest, account });
        return result.accessToken;
      }
      throw err;
    }
  }
}
