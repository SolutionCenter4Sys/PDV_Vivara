import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Activity, CloudOff, Wifi } from 'lucide-react';
import { createElement } from 'react';
import { usePosStore } from '@/store/usePosStore';

/**
 * EP-05-F8 · LI-10 Self-Healing PDV + NOC
 *
 * Simulador de alertas proativos do NOC FourSYS para demonstração:
 * - 1ª janela (45s): NOC detecta drift de RAM e reinicia estação
 * - 2ª janela (90s): teste de modo offline → alerta de queda 4G
 * - 3ª janela (140s): reconexão automática + sync
 *
 * Em produção este hook seria substituído por um SignalR conectado
 * ao NOC de Datadog + Dynatrace com runbooks automáticos.
 */
export function useNocSimulator() {
  const setConnectivity = usePosStore(s => s.setConnectivity);
  const fired = useRef({ noc: false, offline: false, online: false });

  useEffect(() => {
    if (fired.current.noc) return;

    const t1 = setTimeout(() => {
      if (fired.current.noc) return;
      fired.current.noc = true;
      toast.message('LI-10 · NOC FourSYS · self-healing', {
        description:
          'Detectado drift de RAM na estação 03. Failover preventivo em 2 min · sem impacto na venda.',
        icon: createElement(Activity, { size: 16 }),
        duration: 8000,
      });
    }, 45_000);

    const t2 = setTimeout(() => {
      if (fired.current.offline) return;
      fired.current.offline = true;
      setConnectivity('offline');
      toast.warning('Conexão 4G instável · modo offline ativado', {
        description:
          'PDV continua operando. NFC-e em modo contingência · transações em fila local com sync automático.',
        icon: createElement(CloudOff, { size: 16 }),
        duration: 9000,
      });
    }, 90_000);

    const t3 = setTimeout(() => {
      if (fired.current.online) return;
      fired.current.online = true;
      setConnectivity('online');
      toast.success('Conexão restaurada · sync concluído', {
        description: 'Transações offline sincronizadas com SAP CAR · NFC-e validadas pela SEFAZ.',
        icon: createElement(Wifi, { size: 16 }),
        duration: 6000,
      });
    }, 140_000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [setConnectivity]);
}
