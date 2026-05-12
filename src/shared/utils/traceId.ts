/**
 * FRONTEND_TRACE_ID · gerado por requisição · injetado no httpClient.
 * Padrão Fourmakers v2 · permite correlação fim-a-fim com Datadog/Dynatrace
 * + SAP CAR + SEFAZ. Em produção · prefixo da loja para multi-tenant log split.
 */
const HEX = '0123456789abcdef';

function rng(len: number): string {
  let out = '';
  for (let i = 0; i < len; i += 1) out += HEX[Math.floor(Math.random() * 16)];
  return out;
}

/**
 * Formato `pdv-<storeId|anon>-<timestamp>-<rand>`
 * Ex.: pdv-IT-MORUMBI-1m4a-9c3f1e2b
 */
export function generateTraceId(storeId?: string): string {
  const tag = storeId ? storeId.toLowerCase() : 'anon';
  const t = Date.now().toString(36);
  return `pdv-${tag}-${t}-${rng(8)}`;
}
