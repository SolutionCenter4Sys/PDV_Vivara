import { usePosStore } from '@/store/usePosStore';
import clsx from 'clsx';

export function ConnectionBadge() {
  const { connectivity, syncQueue, setConnectivity } = usePosStore();
  const cycle = () => {
    const next = connectivity === 'online' ? 'offline' : connectivity === 'offline' ? 'fault' : 'online';
    setConnectivity(next);
  };
  return (
    <button
      type="button"
      onClick={cycle}
      className={clsx(
        'conn-badge transition-colors hover:opacity-80',
        connectivity === 'online' && 'bg-success/10 text-success',
        connectivity === 'offline' && 'bg-warning/15 text-coral-500',
        connectivity === 'fault' && 'bg-danger/10 text-danger',
      )}
      title="Clique para alternar (demo)"
    >
      <span
        className={clsx(
          'w-2 h-2 rounded-full',
          connectivity === 'online' && 'bg-success animate-pulse',
          connectivity === 'offline' && 'bg-coral-500',
          connectivity === 'fault' && 'bg-danger',
        )}
      />
      {connectivity === 'online' && 'Online · sincronizado'}
      {connectivity === 'offline' && `Modo offline · ${syncQueue} tx em fila`}
      {connectivity === 'fault' && 'NFC-e indisponível'}
    </button>
  );
}
