import { usePosStore } from '@/store/usePosStore';
import clsx from 'clsx';

/**
 * ConnectionBadge · indicador de conectividade (online/offline/fault).
 *
 * Compactação responsiva (Mai/26):
 *   <md  : escondido (drawer mobile já exibe status detalhado)
 *   md+  : ponto + label curto ("Online", "Offline · Nx", "NFC-e off")
 *   2xl+ : label completo ("Online · sincronizado", "Modo offline · N tx em fila")
 *
 * O label completo continua disponível via `title` (tooltip nativo) em todos os
 * tamanhos para garantir legibilidade quando o vendedor passar o mouse.
 */
export function ConnectionBadge() {
  const { connectivity, syncQueue, setConnectivity } = usePosStore();
  const cycle = () => {
    const next = connectivity === 'online' ? 'offline' : connectivity === 'offline' ? 'fault' : 'online';
    setConnectivity(next);
  };

  const fullLabel =
    connectivity === 'online'
      ? 'Online · sincronizado'
      : connectivity === 'offline'
        ? `Modo offline · ${syncQueue} tx em fila`
        : 'NFC-e indisponível';
  const shortLabel =
    connectivity === 'online'
      ? 'Online'
      : connectivity === 'offline'
        ? `Offline · ${syncQueue}x`
        : 'NFC-e off';

  return (
    <button
      type="button"
      onClick={cycle}
      className={clsx(
        'conn-badge transition-colors hover:opacity-80 hidden md:inline-flex',
        connectivity === 'online' && 'bg-success/10 text-success',
        connectivity === 'offline' && 'bg-warning/15 text-coral-500',
        connectivity === 'fault' && 'bg-danger/10 text-danger',
      )}
      title={`${fullLabel} · clique para alternar (demo)`}
      aria-label={fullLabel}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'w-2 h-2 rounded-full',
          connectivity === 'online' && 'bg-success animate-pulse',
          connectivity === 'offline' && 'bg-coral-500',
          connectivity === 'fault' && 'bg-danger',
        )}
      />
      <span className="2xl:hidden">{shortLabel}</span>
      <span className="hidden 2xl:inline">{fullLabel}</span>
    </button>
  );
}
