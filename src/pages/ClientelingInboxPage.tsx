import { useMemo, useState } from 'react';
import {
  Inbox,
  Sparkles,
  Send,
  Search,
  TrendingUp,
  Calendar,
  Heart,
  Cake,
  ShoppingBag,
  CheckCircle2,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Modal } from '@/components/Modal';
import { customers } from '@/data/mocks';
import { formatBRL, formatRelativeDate } from '@/utils/format';

/**
 * EP-05-F4 · LI-05 Clienteling Antecipatório.
 *
 * Inbox proativo: Agente IA Vivara (com fallback Einstein) cruza CDP +
 * histórico cross-channel + sinais de loja para gerar leads "ready-to-buy"
 * para o vendedor. Cada card sugere ação 1:1 personalizada via WhatsApp.
 */

type LeadKind = 'birthday' | 'wishlist_drop' | 'tier_promote' | 'recurring' | 'reactivation';

interface ClientelingLead {
  id: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  kind: LeadKind;
  score: number; // 0-1 prob de compra
  predictedTicket: number;
  rationale: string;
  daysUntil?: number;
  topProductSuggestion: string;
  createdAt: string;
}

const KIND_LABEL: Record<LeadKind, string> = {
  birthday: 'Aniversário',
  wishlist_drop: 'Wishlist · queda de preço',
  tier_promote: 'Próximo do próximo tier',
  recurring: 'Compra recorrente prevista',
  reactivation: 'Reativação',
};

const KIND_ICON: Record<LeadKind, typeof Cake> = {
  birthday: Cake,
  wishlist_drop: Heart,
  tier_promote: TrendingUp,
  recurring: ShoppingBag,
  reactivation: Calendar,
};

const KIND_COLOR: Record<LeadKind, string> = {
  birthday: 'border-coral-500 bg-coral-50',
  wishlist_drop: 'border-life bg-pink-50',
  tier_promote: 'border-success bg-success/5',
  recurring: 'border-warning bg-warning-light',
  reactivation: 'border-ink-7 bg-ink-1',
};

function buildLeads(): ClientelingLead[] {
  return customers.slice(0, 6).map((c, idx) => {
    const seed = c.id.charCodeAt(c.id.length - 1) + idx;
    const kinds: LeadKind[] = ['birthday', 'wishlist_drop', 'tier_promote', 'recurring', 'reactivation'];
    const kind = kinds[seed % kinds.length];
    const score = Number(((0.6 + (seed % 35) / 100) % 1).toFixed(2));
    const ticket = 800 + (seed * 137) % 9000;
    return {
      id: `LEAD-${c.id}-${idx}`,
      customerId: c.id,
      customerName: c.name,
      customerTier: c.tier,
      kind,
      score,
      predictedTicket: ticket,
      daysUntil: kind === 'birthday' ? (seed % 14) - 7 : undefined,
      rationale:
        kind === 'birthday'
          ? `Aniversário em ${(seed % 14) - 7} dias · ticket médio histórico R$ ${ticket}`
          : kind === 'wishlist_drop'
            ? 'Item na wishlist teve queda de 12% · alta probabilidade de fechar'
            : kind === 'tier_promote'
              ? `Faltam R$ ${1500 + (seed % 800)} para subir de tier · oportunidade up-sell`
              : kind === 'recurring'
                ? 'Compra a cada 90 dias · próxima janela em 7 dias'
                : 'Sem compra há 8 meses · cliente Diamond reativável',
      topProductSuggestion:
        kind === 'birthday'
          ? 'Coleção Diamond Daily'
          : kind === 'wishlist_drop'
            ? 'Anel Solitário 18k'
            : kind === 'tier_promote'
              ? 'Brincos Crown Diamond'
              : kind === 'recurring'
                ? 'Pulseira Liberte'
                : 'Lookbook personalizado',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * (seed % 48)).toISOString(),
    };
  });
}

export function ClientelingInboxPage() {
  const [leads, setLeads] = useState<ClientelingLead[]>(() => buildLeads());
  const [search, setSearch] = useState('');
  const [activeKind, setActiveKind] = useState<LeadKind | 'all'>('all');
  const [composeLead, setComposeLead] = useState<ClientelingLead | null>(null);

  const filtered = useMemo(() => {
    let list = [...leads].sort((a, b) => b.score - a.score);
    if (activeKind !== 'all') list = list.filter((l) => l.kind === activeKind);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.customerName.toLowerCase().includes(q));
    }
    return list;
  }, [leads, activeKind, search]);

  const handleSent = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setComposeLead(null);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Atendimento', to: '/' }, { label: 'LI-05 · Inbox proativo' }]} />

      <header className="mb-6 flex items-start gap-3">
        <div className="bg-coral-500 text-white w-12 h-12 flex items-center justify-center flex-shrink-0">
          <Inbox size={24} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
            EP-05-F4 · Clienteling Antecipatório
          </p>
          <h1 className="heading-serif text-fluid-h1">Inbox proativo</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            Agente IA · Vivara CDP · {leads.length} oportunidades personalizadas para você atender hoje.
          </p>
        </div>
      </header>

      <section className="card p-3 mb-4 flex items-center gap-3 flex-wrap" aria-label="Filtros">
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search
              size={14}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="input pl-8 text-[12px]"
            />
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveKind('all')}
            className={clsx(
              'px-3 py-2 min-h-[36px] text-[10px] uppercase tracking-cta font-bold border transition',
              activeKind === 'all'
                ? 'bg-ink-7 text-white border-ink-7'
                : 'border-border text-ink-5 hover:border-ink-7 hover:text-ink-7',
            )}
          >
            Todos · {leads.length}
          </button>
          {(Object.keys(KIND_LABEL) as LeadKind[]).map((k) => {
            const Icon = KIND_ICON[k];
            const count = leads.filter((l) => l.kind === k).length;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setActiveKind(k)}
                className={clsx(
                  'px-3 py-2 min-h-[36px] text-[10px] uppercase tracking-cta font-bold border transition inline-flex items-center gap-1',
                  activeKind === k
                    ? 'bg-coral-500 text-white border-coral-500'
                    : 'border-border text-ink-5 hover:border-coral-500',
                )}
              >
                <Icon size={11} aria-hidden="true" />
                {KIND_LABEL[k]} · {count}
              </button>
            );
          })}
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="card p-10 text-center text-ink-5">
          Inbox limpo · todas as oportunidades atendidas.
        </p>
      ) : (
        <ul role="list" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((l) => {
            const Icon = KIND_ICON[l.kind];
            return (
              <li key={l.id} className={clsx('card p-4 border-l-4', KIND_COLOR[l.kind])}>
                <header className="flex items-start gap-2 mb-3">
                  <div className="bg-ink-7 text-white w-9 h-9 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase tracking-cta font-bold text-ink-5">
                        {KIND_LABEL[l.kind]}
                      </span>
                      <span className="tag bg-success/15 text-success">
                        Score {(l.score * 100).toFixed(0)}
                      </span>
                      <span className="text-[10px] uppercase tracking-cta text-ink-4">
                        há {formatRelativeDate(l.createdAt)}
                      </span>
                    </div>
                    <div className="font-serif text-lg font-semibold text-ink-7 mt-0.5">
                      {l.customerName}
                    </div>
                    <div className="text-[11px] text-ink-5 uppercase tracking-cta">
                      Tier {l.customerTier} · ticket previsto {formatBRL(l.predictedTicket)}
                    </div>
                  </div>
                </header>

                <div className="text-[12px] text-ink-7 mb-2 leading-relaxed">{l.rationale}</div>

                <div className="bg-white border border-border-light px-3 py-2 mb-3 text-[11px] flex items-center gap-2">
                  <Sparkles size={12} aria-hidden="true" className="text-coral-500 flex-shrink-0" />
                  <span>
                    <strong>Sugestão:</strong> {l.topProductSuggestion}
                  </span>
                </div>

                <footer className="flex justify-end gap-2 flex-wrap border-t border-border-light pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setLeads((prev) => prev.filter((other) => other.id !== l.id))
                    }
                    className="btn-tertiary inline-flex items-center gap-1 text-[11px]"
                    aria-label={`Dispensar lead de ${l.customerName}`}
                  >
                    <X size={12} aria-hidden="true" />
                    Dispensar
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposeLead(l)}
                    className="btn-primary btn-sm inline-flex items-center gap-2"
                    aria-label={`Compor mensagem para ${l.customerName}`}
                  >
                    <Send size={12} aria-hidden="true" />
                    Compor mensagem 1:1
                  </button>
                </footer>
              </li>
            );
          })}
        </ul>
      )}

      <ComposeMessageDialog
        lead={composeLead}
        onClose={() => setComposeLead(null)}
        onSent={handleSent}
      />
    </div>
  );
}

function ComposeMessageDialog({
  lead,
  onClose,
  onSent,
}: {
  lead: ClientelingLead | null;
  onClose: () => void;
  onSent: (id: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [tone, setTone] = useState<'caloroso' | 'discreto' | 'urgente'>('caloroso');
  const [generating, setGenerating] = useState(false);

  if (!lead) return null;

  const generateAI = () => {
    setGenerating(true);
    setTimeout(() => {
      const greeting = `Olá ${lead.customerName.split(' ')[0]}! 💎`;
      const opener =
        tone === 'caloroso'
          ? 'Espero que esteja bem.'
          : tone === 'discreto'
            ? ''
            : 'Tenho uma novidade especial pra você.';
      const middle =
        lead.kind === 'birthday'
          ? `Vi que seu aniversário se aproxima · que tal um presente nosso? Selecionei a *${lead.topProductSuggestion}* pensando em você.`
          : lead.kind === 'wishlist_drop'
            ? `O *${lead.topProductSuggestion}* da sua wishlist teve queda de preço esta semana · gostaria de ver?`
            : lead.kind === 'tier_promote'
              ? `Você está muito perto do nosso tier mais exclusivo · com mais 1 peça na sua coleção, libera benefícios premium · que tal o *${lead.topProductSuggestion}*?`
              : lead.kind === 'recurring'
                ? `Como sempre é um prazer atender · separei o *${lead.topProductSuggestion}* que combina com seu estilo.`
                : `Senti sua falta · separei algo especial: *${lead.topProductSuggestion}*. Quer dar uma olhada quando puder?`;
      const cta =
        tone === 'urgente'
          ? '\n\nReservar para você até amanhã 14h?'
          : '\n\nPosso reservar para você experimentar?';
      setDraft([greeting, opener, '', middle, cta].filter(Boolean).join('\n'));
      setGenerating(false);
    }, 900);
  };

  return (
    <Modal
      open={!!lead}
      onClose={() => {
        setDraft('');
        onClose();
      }}
      size="md"
      title={`Mensagem 1:1 · ${lead.customerName}`}
      description={KIND_LABEL[lead.kind]}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-cta font-bold text-ink-5">Tom</span>
          {(['caloroso', 'discreto', 'urgente'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={clsx(
                'px-2 py-1 text-[10px] uppercase tracking-cta font-bold border transition min-h-[32px]',
                tone === t
                  ? 'bg-coral-500 text-white border-coral-500'
                  : 'border-border text-ink-5 hover:border-coral-500',
              )}
              aria-pressed={tone === t}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={generateAI}
            disabled={generating}
            className="ml-auto btn-secondary btn-sm inline-flex items-center gap-1"
          >
            <Sparkles size={11} aria-hidden="true" />
            {generating ? 'Gerando...' : 'Gerar IA'}
          </button>
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          placeholder="Compor mensagem aqui ou usar Gerar IA..."
          className="input resize-none font-serif text-[14px] leading-relaxed"
        />

        <div className="text-[10px] uppercase tracking-cta text-ink-4">
          Caracteres: {draft.length} · WhatsApp Cloud · template HSM aprovado
        </div>

        <div className="flex justify-end gap-2 border-t border-border-light pt-3">
          <button
            type="button"
            onClick={() => {
              setDraft('');
              onClose();
            }}
            className="btn-tertiary inline-flex items-center gap-1"
          >
            <X size={14} aria-hidden="true" />
            Cancelar
          </button>
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => {
              toast.success(`Mensagem enviada para ${lead.customerName}`, {
                description: 'WhatsApp Business · audit-trail registrado.',
              });
              onSent(lead.id);
              setDraft('');
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Send size={14} aria-hidden="true" />
            Enviar via WhatsApp
          </button>
        </div>
      </div>
    </Modal>
  );
}
