import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  MessageCircle,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Modal } from '@/components/Modal';
import { useAppSelector } from '@app/store/hooks';
import { customers } from '@/data/mocks';

/**
 * EP-03-F6 · Agendamento (Appointment).
 *
 * Calendário do vendedor com slots disponíveis (mock determinístico)
 * para reservar atendimentos in-store. Confirmação por WhatsApp + e-mail.
 */

interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  slot: string; // HH:MM
  durationMin: number;
  type: 'consulta' | 'experimentacao' | 'manutencao' | 'evento_privado';
  notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

const initialAppointments: Appointment[] = [
  {
    id: 'APT-001',
    customerId: 'CUST-001',
    customerName: 'Beatriz Almeida',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString().slice(0, 10),
    slot: '14:00',
    durationMin: 60,
    type: 'consulta',
    notes: 'Apresentar coleção Diamond · cliente Diamond',
    status: 'confirmed',
  },
  {
    id: 'APT-002',
    customerId: 'CUST-002',
    customerName: 'Lucas Henrique Silva',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10),
    slot: '11:30',
    durationMin: 30,
    type: 'experimentacao',
    status: 'confirmed',
  },
  {
    id: 'APT-003',
    customerId: 'CUST-003',
    customerName: 'Mariana Souza Lopes',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().slice(0, 10),
    slot: '16:00',
    durationMin: 45,
    type: 'manutencao',
    notes: 'Reapertar pedras anel · OS-2026-1822',
    status: 'pending',
  },
];

const TYPE_LABEL: Record<Appointment['type'], string> = {
  consulta: 'Consultoria',
  experimentacao: 'Experimentação',
  manutencao: 'Manutenção',
  evento_privado: 'Evento privado',
};

const TYPE_COLOR: Record<Appointment['type'], string> = {
  consulta: 'bg-coral-500',
  experimentacao: 'bg-life',
  manutencao: 'bg-warning',
  evento_privado: 'bg-ink-7',
};

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let h = 10; h < 21; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay() === 0 ? 7 : d.getDay();
  const r = new Date(d);
  r.setDate(d.getDate() - (day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

function fmtDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const apptSchema = z.object({
  customerId: z.string().min(1, 'Selecione cliente'),
  date: z.string().min(1, 'Selecione data'),
  slot: z.string().min(1, 'Selecione horário'),
  type: z.enum(['consulta', 'experimentacao', 'manutencao', 'evento_privado']),
  durationMin: z.number().min(15).max(180),
  notes: z.string().optional(),
});
type ApptForm = z.infer<typeof apptSchema>;

export function AppointmentsPage() {
  const seller = useAppSelector((s) => s.auth.seller);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [createOpen, setCreateOpen] = useState(false);
  const [presetSlot, setPresetSlot] = useState<{ date: string; slot: string } | null>(null);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekAnchor);
        d.setDate(weekAnchor.getDate() + i);
        return d;
      }),
    [weekAnchor],
  );

  const slots = useMemo(buildSlots, []);

  const apptByDateSlot = useMemo(() => {
    const map = new Map<string, Appointment>();
    appointments.forEach((a) => map.set(`${a.date}|${a.slot}`, a));
    return map;
  }, [appointments]);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 reveal">
      <Breadcrumb items={[{ label: 'Atendimento', to: '/' }, { label: 'Agendamentos' }]} />

      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-cta font-bold text-coral-500 mb-1">
            EP-03-F6 · Booking
          </p>
          <h1 className="heading-serif text-fluid-h1">Calendário · {seller?.name?.split(' ')[0] ?? 'Vendedor'}</h1>
          <p className="text-ink-5 mt-1 text-[14px]">
            Reserve slots para atendimentos personalizados · cliente recebe confirmação via WhatsApp + e-mail.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPresetSlot(null);
            setCreateOpen(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={14} aria-hidden="true" />
          Novo agendamento
        </button>
      </header>

      <div className="card p-3 mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            const d = new Date(weekAnchor);
            d.setDate(weekAnchor.getDate() - 7);
            setWeekAnchor(d);
          }}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-ink-7 hover:bg-ink-1"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <div className="font-serif text-lg font-semibold text-ink-7">
          {days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} —{' '}
          {days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
        <button
          type="button"
          onClick={() => {
            const d = new Date(weekAnchor);
            d.setDate(weekAnchor.getDate() + 7);
            setWeekAnchor(d);
          }}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-ink-7 hover:bg-ink-1"
          aria-label="Próxima semana"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[12px]" role="grid" aria-label="Calendário semanal">
          <thead>
            <tr>
              <th className="px-2 py-2 text-[10px] uppercase tracking-cta text-ink-5 bg-ink-1 sticky left-0 z-10 min-w-[60px]">
                Hora
              </th>
              {days.map((d) => {
                const isToday = fmtDay(d) === fmtDay(new Date());
                return (
                  <th
                    key={d.toISOString()}
                    scope="col"
                    className={clsx(
                      'px-2 py-2 text-[10px] uppercase tracking-cta bg-ink-1 min-w-[110px]',
                      isToday ? 'text-coral-500' : 'text-ink-5',
                    )}
                  >
                    <div>{d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</div>
                    <div className={clsx('font-serif text-base', isToday && 'font-bold')}>
                      {d.getDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot}>
                <th
                  scope="row"
                  className="px-2 py-1 text-[10px] font-mono text-ink-5 bg-ink-1 sticky left-0 border-t border-border-light"
                >
                  {slot}
                </th>
                {days.map((d) => {
                  const key = `${fmtDay(d)}|${slot}`;
                  const appt = apptByDateSlot.get(key);
                  return (
                    <td key={key} className="border-t border-l border-border-light p-0 align-top">
                      {appt ? (
                        <div
                          className={clsx(
                            'p-1.5 text-[10px] text-white cursor-pointer min-h-[44px] flex flex-col leading-tight',
                            TYPE_COLOR[appt.type],
                            appt.status === 'cancelled' && 'opacity-50 line-through',
                          )}
                          title={`${appt.customerName} · ${TYPE_LABEL[appt.type]} · ${appt.notes ?? ''}`}
                        >
                          <span className="font-bold truncate">{appt.customerName.split(' ')[0]}</span>
                          <span className="opacity-80 truncate text-[9px]">{TYPE_LABEL[appt.type]}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPresetSlot({ date: fmtDay(d), slot });
                            setCreateOpen(true);
                          }}
                          className="w-full min-h-[44px] hover:bg-coral-50 transition flex items-center justify-center"
                          aria-label={`Agendar em ${d.toLocaleDateString('pt-BR')} às ${slot}`}
                        >
                          <Plus size={10} aria-hidden="true" className="text-ink-3" />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateAppointmentDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setPresetSlot(null);
        }}
        preset={presetSlot}
        onCreated={(a) => {
          setAppointments((prev) => [...prev, a]);
          toast.success(`Agendado para ${a.customerName}`, {
            description: (
              <span className="inline-flex items-center gap-2 text-[11px]">
                <MessageCircle size={11} aria-hidden="true" />
                WhatsApp enviado · <Mail size={11} aria-hidden="true" /> e-mail confirmado
              </span>
            ) as unknown as string,
          });
          setCreateOpen(false);
          setPresetSlot(null);
        }}
      />
    </div>
  );
}

function CreateAppointmentDialog({
  open,
  onClose,
  preset,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  preset: { date: string; slot: string } | null;
  onCreated: (a: Appointment) => void;
}) {
  const slots = useMemo(buildSlots, []);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApptForm>({
    resolver: zodResolver(apptSchema),
    defaultValues: {
      customerId: '',
      date: preset?.date ?? new Date().toISOString().slice(0, 10),
      slot: preset?.slot ?? '10:00',
      type: 'consulta',
      durationMin: 30,
      notes: '',
    },
  });

  // Atualizar valores quando preset muda
  useMemo(() => {
    if (preset) {
      setValue('date', preset.date);
      setValue('slot', preset.slot);
    }
  }, [preset, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    await new Promise((r) => setTimeout(r, 500));
    const c = customers.find((cu) => cu.id === data.customerId);
    onCreated({
      id: `APT-${Date.now().toString(36).toUpperCase()}`,
      customerId: data.customerId,
      customerName: c?.name ?? 'Cliente',
      date: data.date,
      slot: data.slot,
      durationMin: data.durationMin,
      type: data.type,
      notes: data.notes,
      status: 'confirmed',
    });
    reset();
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      size="md"
      title="Novo agendamento"
      description={preset ? `${preset.date} às ${preset.slot}` : 'Selecione cliente, data e horário'}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
            <UserIcon size={11} className="inline mr-1" aria-hidden="true" />
            Cliente
          </label>
          <select {...register('customerId')} className="input">
            <option value="">— Selecione —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.tier}
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="text-[11px] text-danger mt-1">{errors.customerId.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              <Calendar size={11} className="inline mr-1" aria-hidden="true" />
              Data
            </label>
            <input type="date" {...register('date')} className="input" />
            {errors.date && <p className="text-[11px] text-danger mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              <Clock size={11} className="inline mr-1" aria-hidden="true" />
              Horário
            </label>
            <select {...register('slot')} className="input">
              {slots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Tipo
            </label>
            <select {...register('type')} className="input">
              {(Object.keys(TYPE_LABEL) as Appointment['type'][]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
              Duração
            </label>
            <select
              {...register('durationMin', { valueAsNumber: true })}
              className="input"
            >
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-label font-bold text-ink-5 block mb-1">
            Notas (opcional)
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Ex: cliente Diamond, apresentar nova coleção..."
            className="input resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border-light pt-3">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="btn-tertiary inline-flex items-center gap-1"
          >
            <X size={14} aria-hidden="true" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary inline-flex items-center gap-2"
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            {isSubmitting ? 'Confirmando...' : 'Confirmar agendamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
