import { injectable } from 'tsyringe';
import {
  DEFAULT_ORG_SLUG,
  getOrgBySlug,
  getOrgByStoreId,
  orgConfigs,
} from '@app/multitenant/orgConfigs';
import type { OrgConfig } from '@app/multitenant/orgConfigs';

/**
 * TenantService · resolve a loja ativa em runtime.
 *
 * - `current()` lê o slug da URL, do storage ou do default.
 * - `setCurrent()` persiste em localStorage (lastStoreId).
 * - É consultado pelo httpClient para gerar FRONTEND_TRACE_ID
 *   e pelo Layout para aplicar tema/brand corretos.
 */
const STORAGE_KEY = 'pdv-vivara:lastStoreSlug';

@injectable()
export class TenantService {
  private active: OrgConfig | null = null;

  list(): OrgConfig[] {
    return orgConfigs;
  }

  current(): OrgConfig {
    if (this.active) return this.active;
    const fromStorage = this.readSlugFromStorage() ?? undefined;
    const resolved =
      getOrgBySlug(fromStorage) ?? getOrgBySlug(DEFAULT_ORG_SLUG) ?? orgConfigs[0];
    this.active = resolved;
    return resolved;
  }

  setCurrentBySlug(slug: string): OrgConfig | null {
    const next = getOrgBySlug(slug);
    if (!next) return null;
    this.active = next;
    this.writeSlugToStorage(next.slug);
    return next;
  }

  setCurrentByStoreId(storeId: string): OrgConfig | null {
    const next = getOrgByStoreId(storeId);
    if (!next) return null;
    this.active = next;
    this.writeSlugToStorage(next.slug);
    return next;
  }

  reset(): void {
    this.active = null;
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  }

  private readSlugFromStorage(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private writeSlugToStorage(slug: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, slug);
    } catch {
      /* noop · SSR ou modo privado */
    }
  }
}
