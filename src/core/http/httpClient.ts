import { generateTraceId } from '@shared/utils/traceId';

/**
 * httpClient factory · padrão Eliza/Fourblox v2.
 *
 * - Injeta Authorization Bearer (provider injetável)
 * - Injeta FRONTEND_TRACE_ID por requisição
 * - 401 → invoca onUnauthorized() (logout automático)
 * - Sanitiza strings vazias
 * - Logs estruturados (Crashlytics / Datadog em produção)
 *
 * Em DEV o PDV Vivara opera com mocks · setMockHandler() permite resolver
 * sem rede. Em produção · setBaseUrl() aponta para o gateway iPaaS Digibee.
 *
 * Páginas/hooks NUNCA usam fetch/axios direto. Sempre via httpClient.
 */

export interface HttpRequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type TokenProvider = () => string | null;
type StoreIdProvider = () => string | undefined;
type UnauthorizedHandler = () => void;
type MockHandler = (
  method: Method,
  path: string,
  body: unknown,
  options: HttpRequestOptions | undefined,
) => Promise<unknown>;

interface HttpClientConfig {
  baseUrl: string;
  getToken: TokenProvider;
  getStoreId?: StoreIdProvider;
  onUnauthorized: UnauthorizedHandler;
  mockHandler?: MockHandler;
  /**
   * Endpoints que NÃO devem disparar logout em 401
   * (ex.: refresh, healthcheck, ou rotas de RH no Fourmakers).
   */
  skipUnauthorizedFor?: RegExp[];
}

class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  setBaseUrl(baseUrl: string): void {
    this.config.baseUrl = baseUrl;
  }

  setMockHandler(handler: MockHandler | undefined): void {
    this.config.mockHandler = handler;
  }

  setTokenProvider(provider: TokenProvider): void {
    this.config.getToken = provider;
  }

  setStoreIdProvider(provider: StoreIdProvider): void {
    this.config.getStoreId = provider;
  }

  async get<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  async put<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  async patch<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  async delete<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: Method,
    path: string,
    body: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const traceId = generateTraceId(this.config.getStoreId?.());

    if (this.config.mockHandler) {
      try {
        const result = await this.config.mockHandler(method, path, body, options);
        return result as T;
      } catch (err) {
        this.handleError(err, traceId, path);
        throw err;
      }
    }

    const url = this.buildUrl(path, options?.query);
    const token = this.config.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Frontend-Trace-Id': traceId,
      ...(options?.headers ?? {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const init: RequestInit = {
      method,
      headers,
      signal: options?.signal,
    };
    if (body !== undefined) init.body = JSON.stringify(this.sanitize(body));

    const response = await fetch(url, init);

    if (response.status === 401 && !this.shouldSkipUnauthorized(path)) {
      this.config.onUnauthorized();
      throw new Error('Sessão expirada · redirecionando para login');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      this.handleError(new Error(errorText), traceId, path);
      throw new Error(`HTTP ${response.status} · ${response.statusText}`);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  private buildUrl(path: string, query?: HttpRequestOptions['query']): string {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const cleaned = path.startsWith('/') ? path : `/${path}`;
    if (!query) return `${base}${cleaned}`;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      params.append(k, String(v));
    }
    const qs = params.toString();
    return qs ? `${base}${cleaned}?${qs}` : `${base}${cleaned}`;
  }

  private sanitize(body: unknown): unknown {
    if (body === null || typeof body !== 'object') return body;
    if (Array.isArray(body)) return body.map((item) => this.sanitize(item));
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim() === '') continue;
      out[k] = this.sanitize(v);
    }
    return out;
  }

  private shouldSkipUnauthorized(path: string): boolean {
    return (this.config.skipUnauthorizedFor ?? []).some((re) => re.test(path));
  }

  private handleError(err: unknown, traceId: string, path: string): void {
    // Em produção · enviar para Crashlytics + Datadog.
    // Em dev · console.error é aceitável para diagnóstico.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[httpClient]', { traceId, path, err });
    }
  }
}

let instance: HttpClient | null = null;

export function createHttpClient(config: HttpClientConfig): HttpClient {
  instance = new HttpClient(config);
  return instance;
}

export function getHttpClient(): HttpClient {
  if (!instance) {
    throw new Error(
      'httpClient não inicializado · chame createHttpClient() no bootstrap antes de qualquer Repository.',
    );
  }
  return instance;
}

export type { HttpClient };
