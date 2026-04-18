import { useEffect, useState, useMemo } from 'react';
import { Routine, RoutinePeriod } from '@/types/routine';
import { RoutineRow, RoutineRowHeader } from './RoutineRow';
import { AddRoutineDrawer } from './AddRoutineDrawer';
import { Moon, Sun, Sunrise, ChevronDown, AlertCircle, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'bsg-period-accordion-state';

const periodConfig: Record<RoutinePeriod, { title: string; time: string; icon: typeof Moon; emoji: string }> = {
  dawn:    { title: 'Madrugada', time: '00h – 06h', icon: Moon,    emoji: '🌙' },
  morning: { title: 'Matutino',  time: '06h – 12h', icon: Sunrise, emoji: '☀️' },
  night:   { title: 'Noturno',   time: '18h – 00h', icon: Sun,     emoji: '🌑' },
};

const periods: RoutinePeriod[] = ['dawn', 'morning', 'night'];

const currentPeriod = (): RoutinePeriod => {
  const h = new Date().getHours();
  if (h >= 0 && h < 6) return 'dawn';
  if (h >= 6 && h < 12) return 'morning';
  return 'night';
};

interface Props {
  getByPeriod: (p: RoutinePeriod) => Routine[];
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, reason?: string) => void;
  onReset: (id: string) => void;
  onAdd: (routine: any) => void;
}

export function RoutinePeriodList({ getByPeriod, onUpdate, onDelete, onStart, onReset, onAdd }: Props) {
  const [open, setOpen] = useState<Record<RoutinePeriod, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    const cur = currentPeriod();
    return { dawn: cur === 'dawn', morning: cur === 'morning', night: cur === 'night' };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(open));
  }, [open]);

  const toggle = (p: RoutinePeriod) => setOpen(s => ({ ...s, [p]: !s[p] }));

  return (
    <div className="space-y-3">
      {periods.map(period => {
        const cfg = periodConfig[period];
        const Icon = cfg.icon;
        const routines = getByPeriod(period);
        const isOpen = open[period];

        return (
          <PeriodAccordion
            key={period}
            period={period}
            isOpen={isOpen}
            onToggle={() => toggle(period)}
            routines={routines}
            cfg={cfg}
            Icon={Icon}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onStart={onStart}
            onReset={onReset}
            onAdd={onAdd}
          />
        );
      })}
    </div>
  );
}

interface AccordionProps {
  period: RoutinePeriod;
  isOpen: boolean;
  onToggle: () => void;
  routines: Routine[];
  cfg: { title: string; time: string; emoji: string };
  Icon: typeof Moon;
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, reason?: string) => void;
  onReset: (id: string) => void;
  onAdd: (routine: any) => void;
}

const STATUS_PRIORITY: Record<Routine['status'], number> = {
  error: 0,
  running: 1,
  idle: 2,
  success: 3,
};

function PeriodAccordion({ period, isOpen, onToggle, routines: rawRoutines, cfg, Icon, onUpdate, onDelete, onStart, onReset, onAdd }: AccordionProps) {
  const routines = useMemo(
    () => [...rawRoutines].sort((a, b) => {
      const diff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      if (diff !== 0) return diff;
      return (a.cod_rotina || a.name).localeCompare(b.cod_rotina || b.name);
    }),
    [rawRoutines],
  );

  const counts = useMemo(() => ({
    total: routines.length,
    idle: routines.filter(r => r.status === 'idle').length,
    running: routines.filter(r => r.status === 'running').length,
    success: routines.filter(r => r.status === 'success').length,
    error: routines.filter(r => r.status === 'error').length,
  }), [routines]);

  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/95 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="h-5 w-5 shrink-0" />
          <div className="flex items-baseline gap-2 min-w-0">
            <h2 className="font-semibold text-sm">{cfg.title}</h2>
            <span className="text-xs opacity-70 font-normal">{cfg.time}</span>
          </div>
          <Badge className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20 text-xs font-medium border-0">
            {counts.total} rotina{counts.total !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <StatusSummary counts={counts} />
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          {routines.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma rotina cadastrada neste período.
            </div>
          ) : (
            <>
              <RoutineRowHeader />
              {routines.map(r => (
                <RoutineRow
                  key={r.id}
                  routine={r}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onStart={onStart}
                  onReset={onReset}
                />
              ))}
            </>
          )}

          <div className="px-4 py-2.5 bg-muted/20 border-t border-border flex justify-end">
            <AddRoutineDrawer period={period} onAdd={onAdd} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusSummary({ counts }: { counts: { idle: number; running: number; success: number; error: number } }) {
  const items: Array<{ key: string; n: number; label: string; Icon: typeof Clock; cls: string }> = [
    { key: 'running', n: counts.running, label: 'em execução', Icon: Loader2,      cls: 'text-info' },
    { key: 'error',   n: counts.error,   label: 'erro',         Icon: AlertCircle, cls: 'text-destructive' },
    { key: 'success', n: counts.success, label: 'concluído',    Icon: CheckCircle2,cls: 'text-success-foreground' },
    { key: 'idle',    n: counts.idle,    label: 'aguardando',   Icon: Clock,       cls: 'text-primary-foreground/70' },
  ];
  const visible = items.filter(i => i.n > 0);
  if (visible.length === 0) return null;

  return (
    <div className="hidden md:flex items-center gap-2.5 text-[11px] text-primary-foreground/90">
      {visible.map(({ key, n, label, Icon, cls }) => (
        <span key={key} className="flex items-center gap-1">
          <Icon className={cn("h-3 w-3", cls, key === 'running' && 'animate-spin')} />
          <span><strong className="font-semibold">{n}</strong> {label}</span>
        </span>
      ))}
    </div>
  );
}
