import { CloudOff, AlertTriangle } from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';

/**
 * Banner global · EP-01-F1 · Operação Offline com Sync
 *
 * Aparece quando o store sinaliza modo offline. Vendedor sabe que:
 * - NFC-e será emitida em modo contingência
 * - TEF tentará offline (limite R$ 200)
 * - Transações vão para fila local com sync automático ao reconectar
 */
export function OfflineBanner() {
  const offline = usePosStore(s => s.offline);
  const queuedTransactions = usePosStore(s => s.queuedTransactions);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-warning text-ink-7 border-b border-warning"
    >
      <div className="max-w-grid-wide mx-auto px-4 md:px-6 lg:px-8 py-2.5 flex items-center gap-3 flex-wrap">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-ink-7 text-warning flex items-center justify-center flex-shrink-0"
        >
          <CloudOff size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-cta font-bold flex items-center gap-2">
            <AlertTriangle size={11} aria-hidden="true" /> Modo offline · contingência fiscal ativo
          </div>
          <div className="text-[12px] text-ink-7/80 mt-0.5">
            NFC-e será emitida em modo contingência · TEF limite R$ 200 · transações vão para fila local
            {queuedTransactions > 0 && (
              <strong className="ml-2 font-bold">· {queuedTransactions} pendente{queuedTransactions === 1 ? '' : 's'} de sincronização</strong>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
