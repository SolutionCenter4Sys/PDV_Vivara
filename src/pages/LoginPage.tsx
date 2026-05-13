import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { container } from '@core/di/container';
import { CoreTokens } from '@core/di/tokens/core.tokens';
import type { MsalService } from '@core/auth/MsalService';
import type { TenantService } from '@core/tenant/TenantService';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { loginPinSuccess, loginSsoSuccess } from '@app/store/slices/authSlice';
import { sellers } from '@/data/mocks';
import { msalConfigured } from '@core/auth/msalConfig';

export function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const seller = useAppSelector((s) => s.auth.seller);

  const tenant = container.resolve<TenantService>(CoreTokens.TenantService);

  const redirectAfterLogin = () => {
    const fromState = (location.state as { from?: string } | null)?.from;
    const target = fromState ?? `/loja/${tenant.current().slug}/`;
    navigate(target.startsWith('/') ? target : `/${target}`, { replace: true });
  };

  if (seller) {
    redirectAfterLogin();
    return null;
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = sellers.find((s) => s.pin === pin) ?? null;
    if (found) {
      dispatch(loginPinSuccess(found));
      tenant.setCurrentByStoreId(found.storeId);
      redirectAfterLogin();
    } else {
      setError(
        'PIN inválido. Demo: 1234 (Beatriz · Vivara), 9012 (Renata · Life), 0000 (Patrícia · Gerente).',
      );
    }
  };

  const handleSso = async () => {
    if (!msalConfigured) {
      toast.error('SSO Microsoft não configurado neste ambiente', {
        description:
          'Defina VITE_MSAL_TENANT_ID e VITE_MSAL_CLIENT_ID no .env para habilitar o login SSO.',
      });
      return;
    }
    try {
      setBusy(true);
      const msal = container.resolve<MsalService>(CoreTokens.MsalService);
      await msal.initialize();
      const result = await msal.loginPopup();
      if (!result?.account) {
        toast.warning('Login SSO cancelado');
        return;
      }
      const email = result.account.username;
      // Em prod · resolver vendedor via endpoint /me. Em dev · match por sufixo.
      const matched =
        sellers.find((s) => s.email === email) ??
        sellers.find((s) => email.toLowerCase().startsWith(s.name.split(' ')[0].toLowerCase())) ??
        sellers[0];
      dispatch(loginSsoSuccess({ seller: matched, email }));
      tenant.setCurrentByStoreId(matched.storeId);
      toast.success('Autenticado via Microsoft 365', { description: email });
      redirectAfterLogin();
    } catch (err) {
      toast.error('Falha no login SSO', {
        description: err instanceof Error ? err.message : 'Tente novamente',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen-d flex items-center justify-center bg-coral-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-6xl font-semibold tracking-[0.4em] uppercase text-ink-7 mb-3">
            Vivara
          </h1>
          <p className="text-[11px] uppercase tracking-label text-ink-5 font-bold">
            Novo PDV · Foursys · Clean Arch + TSyringe + Redux + MSAL
          </p>
        </div>

        <form onSubmit={handlePinSubmit} className="bg-white border border-border p-8 reveal">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-label text-coral-500 font-bold mb-5">
            <Lock size={14} />
            Identifique-se
          </div>

          <h2 className="heading-serif text-3xl mb-2">
            Bem-vinda,<br /><em>vendedora.</em>
          </h2>
          <p className="text-ink-5 text-sm mb-6">
            Use seu PIN de 4 dígitos ou faça login com sua conta Microsoft 365.
          </p>

          <div className="field mb-5">
            <label htmlFor="pin">PIN do vendedor</label>
            <input
              id="pin"
              type="password"
              maxLength={4}
              inputMode="numeric"
              pattern="\d{4}"
              autoFocus
              autoComplete="off"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              className={`input text-center font-mono text-3xl tracking-[0.6em] ${error ? 'input-error' : ''}`}
              placeholder="• • • •"
            />
            {error && <span className="err">{error}</span>}
          </div>

          <button type="submit" disabled={pin.length !== 4 || busy} className="btn-primary w-full">
            Entrar com PIN
          </button>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-cta text-ink-4">
            <span className="flex-1 h-px bg-border" />
            ou
            <span className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleSso}
            disabled={busy}
            className="w-full border border-border bg-white hover:bg-coral-50 px-5 py-3 text-[11px] uppercase tracking-cta font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            aria-label={msalConfigured ? 'Entrar com Microsoft 365' : 'SSO Microsoft 365 (não configurado)'}
          >
            <ShieldCheck size={14} className="text-coral-500" />
            {msalConfigured ? 'Entrar com Microsoft 365' : 'SSO Microsoft 365 · não configurado'}
          </button>

          <div className="mt-6 pt-6 border-t border-border-light">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-cta text-ink-5 mb-2">
              <Sparkles size={12} className="text-coral-500" />
              Living Intelligence ativa neste PDV
            </div>
            <p className="text-[11px] text-ink-5 leading-relaxed">
              LI-01 Agente IA · LI-03 Inventário Vivo · LI-10 Self-Healing · LGPD-by-design
            </p>
          </div>
        </form>

        <div className="text-center mt-6 text-[11px] text-ink-4 uppercase tracking-label">
          Versão MVP · 08/05/2026 · Multi-tenant ({tenant.list().length} lojas)
        </div>
      </div>
    </div>
  );
}
