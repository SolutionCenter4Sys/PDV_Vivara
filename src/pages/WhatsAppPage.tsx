import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle,
  Send,
  Search,
  Image as ImageIcon,
  Sparkles,
  Check,
  CheckCheck,
  Phone,
  Paperclip,
  Mic,
  ChevronLeft,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/Breadcrumb';
import { customers } from '@/data/mocks';
import { formatRelativeDate } from '@/utils/format';

/**
 * EP-03-F5 · WhatsApp Business 1:1 embedded.
 *
 * UI dual-pane (lista de conversas + thread) integrada à API WhatsApp Cloud
 * (Meta) via iPaaS Digibee. Suporta templates HSM aprovados, mídia e
 * sugestões IA contextual.
 */

type MsgDirection = 'inbound' | 'outbound';
interface ChatMessage {
  id: string;
  direction: MsgDirection;
  text: string;
  at: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface ChatThread {
  customerId: string;
  customerName: string;
  customerPhone: string;
  unread: number;
  lastSeen: string;
  messages: ChatMessage[];
}

const initialThreads: ChatThread[] = customers.slice(0, 6).map((c, idx) => {
  const baseSeed = c.id.charCodeAt(c.id.length - 1);
  const offsetMin = (baseSeed * 7 + idx * 11) % 240;
  const lastSeen = new Date(Date.now() - 1000 * 60 * offsetMin).toISOString();
  const sample: Record<number, ChatMessage[]> = {
    0: [
      {
        id: 'm-0-1',
        direction: 'inbound',
        text: 'Oi Bia! Vi o anel solitário no Insta, ainda tem em estoque?',
        at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
      {
        id: 'm-0-2',
        direction: 'outbound',
        text: 'Oi! Tem sim · 18k com diamante 0.5ct. Quer que eu separe na loja?',
        at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
        status: 'read',
      },
      {
        id: 'm-0-3',
        direction: 'inbound',
        text: 'Quero! Posso passar amanhã às 14h?',
        at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ],
    1: [
      {
        id: 'm-1-1',
        direction: 'outbound',
        text: 'Olá! Sua peça da assistência está pronta para retirada 💎',
        at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        status: 'delivered',
      },
    ],
    2: [
      {
        id: 'm-2-1',
        direction: 'inbound',
        text: 'Bom dia! Preciso de uma sugestão para Dia das Mães · até R$ 1.500.',
        at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
  };
  return {
    customerId: c.id,
    customerName: c.name,
    customerPhone: c.phone,
    unread: idx === 2 ? 1 : idx === 0 ? 1 : 0,
    lastSeen,
    messages: sample[idx] ?? [
      {
        id: `m-${idx}-greet`,
        direction: 'inbound',
        text: 'Oi, tudo bem?',
        at: lastSeen,
      },
    ],
  };
});

const TEMPLATES = [
  'Sua peça já está pronta para retirada! 💎',
  'Acabou de chegar uma novidade que combina com seu estilo · quer ver?',
  'Lembrete: aniversário próximo · que tal preparar uma surpresa?',
  'Confira nosso novo lookbook da coleção {{coleção}} · {{link}}',
];

const AI_SUGGESTIONS = [
  'Cliente Diamond · sugerir peça acima de R$ 4.000',
  'Histórico aponta interesse em coleção Diamond · cross-sell brincos',
  'Ticket médio R$ 2.840 · evitar pricing baixo demais',
];

export function WhatsAppPage() {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(initialThreads[0]?.customerId ?? null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [showAI, setShowAI] = useState(true);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter(
      (t) =>
        t.customerName.toLowerCase().includes(q) ||
        t.customerPhone.includes(q) ||
        t.messages.some((m) => m.text.toLowerCase().includes(q)),
    );
  }, [threads, search]);

  const active = threads.find((t) => t.customerId === activeId) ?? null;

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length, activeId]);

  useEffect(() => {
    if (active && active.unread > 0) {
      setThreads((prev) =>
        prev.map((t) => (t.customerId === active.customerId ? { ...t, unread: 0 } : t)),
      );
    }
  }, [active]);

  const send = () => {
    if (!draft.trim() || !active) return;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      direction: 'outbound',
      text: draft.trim(),
      at: new Date().toISOString(),
      status: 'sent',
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.customerId === active.customerId
          ? { ...t, messages: [...t.messages, newMsg], lastSeen: newMsg.at }
          : t,
      ),
    );
    setDraft('');

    // Simula transição de status
    setTimeout(() => {
      setThreads((prev) =>
        prev.map((t) =>
          t.customerId === active.customerId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === newMsg.id ? { ...m, status: 'delivered' } : m,
                ),
              }
            : t,
        ),
      );
    }, 800);
    setTimeout(() => {
      setThreads((prev) =>
        prev.map((t) =>
          t.customerId === active.customerId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === newMsg.id ? { ...m, status: 'read' } : m,
                ),
              }
            : t,
        ),
      );
    }, 2500);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Atendimento', to: '/' }, { label: 'WhatsApp Business' }]} />

      <header className="mb-4 flex items-start gap-3">
        <div className="bg-success text-white w-12 h-12 flex items-center justify-center flex-shrink-0">
          <MessageCircle size={24} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
            EP-03-F5 · Meta WhatsApp Business
          </p>
          <h1 className="heading-serif text-fluid-h1">Conversas</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            Templates HSM aprovados · catálogo embarcado · audit-trail completo (LGPD).
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] border border-border min-h-[600px] max-h-[80dvh]">
        <aside className={clsx('border-r border-border bg-white flex flex-col', activeId && 'hidden lg:flex')}>
          <div className="p-3 border-b border-border-light">
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
                placeholder="Buscar conversa..."
                className="input pl-8 text-[12px]"
                aria-label="Buscar conversa"
              />
            </div>
          </div>
          <ul role="list" className="flex-1 overflow-y-auto divide-y divide-border-light">
            {filtered.map((t) => (
              <li key={t.customerId}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.customerId)}
                  className={clsx(
                    'w-full text-left px-3 py-3 hover:bg-ink-1 transition flex items-start gap-2',
                    t.customerId === activeId && 'bg-coral-50',
                  )}
                  aria-label={`Abrir conversa com ${t.customerName}`}
                >
                  <div className="bg-success text-white w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[12px]">
                    {t.customerName
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink-7 truncate text-[13px]">
                        {t.customerName}
                      </span>
                      <span className="text-[10px] text-ink-4 whitespace-nowrap">
                        {formatRelativeDate(t.lastSeen)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[11px] text-ink-5 truncate">
                        {t.messages[t.messages.length - 1]?.text}
                      </span>
                      {t.unread > 0 && (
                        <span className="bg-success text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {t.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-[12px] text-ink-5">Sem conversas.</li>
            )}
          </ul>
        </aside>

        <section className={clsx('flex flex-col bg-ink-1', !activeId && 'hidden lg:flex')}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-ink-5 text-[13px]">
              Selecione uma conversa.
            </div>
          ) : (
            <>
              <header className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-ink-7"
                  aria-label="Voltar para lista de conversas"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <div className="bg-success text-white w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[12px]">
                  {active.customerName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-7 truncate">{active.customerName}</div>
                  <div className="text-[10px] text-ink-5 inline-flex items-center gap-1">
                    <Phone size={9} aria-hidden="true" />
                    {active.customerPhone} · online {formatRelativeDate(active.lastSeen)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAI((v) => !v)}
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-cta font-bold transition min-h-[36px]',
                    showAI
                      ? 'bg-coral-500 text-white'
                      : 'bg-ink-2 text-ink-7 hover:bg-coral-50',
                  )}
                  aria-pressed={showAI}
                  aria-label="Alternar painel de sugestões IA"
                >
                  <Sparkles size={10} aria-hidden="true" />
                  IA
                </button>
              </header>

              {showAI && (
                <aside className="bg-coral-50 border-b border-coral-200 px-4 py-2">
                  <div className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1 inline-flex items-center gap-1">
                    <Sparkles size={11} aria-hidden="true" />
                    Sugestões para {active.customerName.split(' ')[0]}
                  </div>
                  <ul className="text-[11px] space-y-0.5" role="list">
                    {AI_SUGGESTIONS.map((s, i) => (
                      <li key={i} className="text-ink-7">
                        · {s}
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Cpath%20fill%3D%22%23ece5dd%22%20d%3D%22M0%200h40v40H0z%22%2F%3E%3C%2Fsvg%3E')]">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={clsx('flex', m.direction === 'outbound' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={clsx(
                        'max-w-[78%] px-3 py-2 shadow-sm',
                        m.direction === 'outbound'
                          ? 'bg-success/15 text-ink-7 border-l-4 border-success'
                          : 'bg-white text-ink-7',
                      )}
                    >
                      <div className="text-[13px] leading-snug whitespace-pre-wrap">{m.text}</div>
                      <div className="text-[9px] text-ink-4 mt-1 flex items-center gap-1 justify-end">
                        {new Date(m.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {m.direction === 'outbound' && m.status && (
                          <>
                            {m.status === 'sent' && <Check size={10} aria-hidden="true" />}
                            {m.status === 'delivered' && <CheckCheck size={10} aria-hidden="true" />}
                            {m.status === 'read' && (
                              <CheckCheck size={10} aria-hidden="true" className="text-success" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>

              <div className="bg-white border-t border-border-light p-2">
                <div className="flex flex-wrap gap-1 mb-2 px-1">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDraft(t)}
                      className="text-[10px] uppercase tracking-cta font-bold border border-border px-2 py-1 min-h-[32px] hover:border-coral-500 hover:text-coral-500 transition normal-case"
                      aria-label={`Usar template: ${t}`}
                    >
                      {t.length > 50 ? t.slice(0, 47) + '...' : t}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="flex items-end gap-2"
                >
                  <button
                    type="button"
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-ink-5 hover:text-ink-7"
                    aria-label="Anexar arquivo"
                    onClick={() => toast.info('Anexar arquivo · roadmap')}
                  >
                    <Paperclip size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-ink-5 hover:text-ink-7"
                    aria-label="Anexar imagem"
                    onClick={() => toast.info('Catálogo embarcado · roadmap')}
                  >
                    <ImageIcon size={18} aria-hidden="true" />
                  </button>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Digite uma mensagem..."
                    className="input flex-1 resize-none py-2"
                    aria-label="Texto da mensagem"
                  />
                  <button
                    type="button"
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-ink-5 hover:text-ink-7"
                    aria-label="Gravar áudio"
                    onClick={() => toast.info('Áudio · roadmap')}
                  >
                    <Mic size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="btn-primary inline-flex items-center gap-2 min-h-[44px]"
                    aria-label="Enviar mensagem"
                  >
                    <Send size={14} aria-hidden="true" />
                    Enviar
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
