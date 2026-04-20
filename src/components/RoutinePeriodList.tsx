import { useEffect, useState, useMemo, useCallback } from 'react';
import { Routine, RoutinePeriod, RoutineStatus, DateReference } from '@/types/routine';
import { RoutineRow, RoutineRowHeader } from './RoutineRow';
import { AddRoutineDrawer } from './AddRoutineDrawer';
import { RoutineFiltersToolbar } from './RoutineFiltersToolbar';
import { Moon, Sun, Sunrise, ChevronDown, AlertCircle, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'bsg-period-accordion-state';
const FILTERS_STORAGE_KEY = 'bsg-routine-filters-v1';

interface PersistedFilters {
  searchQuery: string;
  statusFilter: RoutineStatus[];
  dateRefFilter: DateReference[];
}

function loadPersistedFilters(): PersistedFilters {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PersistedFilters>;
      return {
        searchQuery: typeof p.searchQuery === 'string' ? p.searchQuery : '',
        statusFilter: Array.isArray(p.statusFilter) ? p.statusFilter : [],
        dateRefFilter: Array.isArray(p.dateRefFilter) ? p.dateRefFilter : [],
      };
    }
  } catch { /* ignore */ }
  return { searchQuery: '', statusFilter: [], dateRefFilter: [] };
}

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

function applyRoutineFilters(
  routines: Routine[],
  q: string,
  statusFilter: Set<RoutineStatus>,
  dateRefFilter: Set<DateReference>,
): Routine[] {
  const needle = q.trim().toLowerCase();
  return routines.filter(r => {
    if (needle) {
      const code = (r.cod_rotina || '').toLowerCase();
      const name = r.name.toLowerCase();
      if (!code.includes(needle) && !name.includes(needle)) return false;
    }
    if (statusFilter.size > 0 && !statusFilter.has(r.status)) return false;
    if (dateRefFilter.size > 0 && !dateRefFilter.has(r.dateReference)) return false;
    return true;
  });
}

interface Props {
  routines: Routine[];
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, reason?: string) => void;
  onReset: (id: string) => void;
  onAdd: (routine: any) => void;
}

export function RoutinePeriodList({ routines, onUpdate, onDelete, onStart, onReset, onAdd }: Props) {
  const persisted = useMemo(() => loadPersistedFilters(), []);

  const [open, setOpen] = useState<Record<RoutinePeriod, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    const cur = currentPeriod();
    return { dawn: cur === 'dawn', morning: cur === 'morning', night: cur === 'night' };
  });

  const [searchQuery, setSearchQuery] = useState(persisted.searchQuery);
  const [statusFilter, setStatusFilter] = useState<Set<RoutineStatus>>(() => new Set(persisted.statusFilter));
  const [dateRefFilter, setDateRefFilter] = useState<Set<DateReference>>(() => new Set(persisted.dateRefFilter));

  // Auto-abrir accordions de períodos que tenham rotinas em ERRO (apenas uma vez por sessão).
  const [autoOpenedForErrors, setAutoOpenedForErrors] = useState(false);
  useEffect(() => {
    if (autoOpenedForErrors) return;
    const periodsWithError = new Set(
      routines.filter(r => r.status === 'error').map(r => r.period),
    );
    if (periodsWithError.size === 0) return;
    setOpen(prev => {
      const next = { ...prev };
      periodsWithError.forEach(p => { next[p] = true; });
      return next;
    });
    setAutoOpenedForErrors(true);
  }, [routines, autoOpenedForErrors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(open));
  }, [open]);

  // Persistência de filtros
  useEffect(() => {
    const payload: PersistedFilters = {
      searchQuery,
      statusFilter: Array.from(statusFilter),
      dateRefFilter: Array.from(dateRefFilter),
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
  }, [searchQuery, statusFilter, dateRefFilter]);

  const toggle = (p: RoutinePeriod) => setOpen(s => ({ ...s, [p]: !s[p] }));

  const filteredRoutines = useMemo(
    () => applyRoutineFilters(routines, searchQuery, statusFilter, dateRefFilter),
    [routines, searchQuery, statusFilter, dateRefFilter],
  );

  const toggleStatus = useCallback((s: RoutineStatus) => {
    setStatusFilter(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);

  const toggleDateRef = useCallback((r: DateReference) => {
    setDateRefFilter(prev => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  }, []);

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter.size > 0 || dateRefFilter.size > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter(new Set());
    setDateRefFilter(new Set());
  }, []);

  return (
    <>
      <div className="fixed top-16 left-0 right-0 z-40 border-b border-border shadow-sm bg-card">
        <div className="container max-w-[1400px] mx-auto">
          <RoutineFiltersToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onToggleStatus={toggleStatus}
            dateRefFilter={dateRefFilter}
            onToggleDateRef={toggleDateRef}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </div>

      <div className={cn('space-y-3 pt-[7.125rem]')}>
        {periods.map(period => {
          const cfg = periodConfig[period];
          const Icon = cfg.icon;
          const periodRoutines = filteredRoutines.filter(r => r.period === period);
          const isOpen = open[period];

          return (
            <PeriodAccordion
              key={period}
              period={period}
              isOpen={isOpen}
              onToggle={() => toggle(period)}
              routines={periodRoutines}
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
    </>
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

function PeriodAccordion({
  period,
  isOpen,
  onToggle,
  routines: rawRoutines,
  cfg,
  Icon,
  onUpdate,
  onDelete,
  onStart,
  onReset,
  onAdd,
}: AccordionProps) {
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
        className="w-full bg-primary text-primary-foreground hover:bg-primary/95 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
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
        </div>
        {counts.total > 0 && <StatusDistributionBar counts={counts} />}
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
              Nenhuma rotina neste período com os filtros atuais.
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

/**
 * Mini-barra horizontal mostrando a distribuição proporcional dos status do período.
 * Cada segmento usa um token semântico e tem tooltip com a contagem.
 */
function StatusDistributionBar({
  counts,
}: { counts: { idle: number; running: number; success: number; error: number } }) {
  const total = counts.idle + counts.running + counts.success + counts.error;
  if (total === 0) return null;

  const segments: Array<{ key: string; n: number; bg: string; label: string }> = [
    { key: 'error',   n: counts.error,   bg: 'bg-destructive',    label: 'em erro' },
    { key: 'running', n: counts.running, bg: 'bg-info',           label: 'em execução' },
    { key: 'idle',    n: counts.idle,    bg: 'bg-primary-foreground/35', label: 'aguardando' },
    { key: 'success', n: counts.success, bg: 'bg-success',        label: 'concluído' },
  ].filter(s => s.n > 0);

  return (
    <div
      className="flex h-1 w-full overflow-hidden bg-primary-foreground/10"
      role="img"
      aria-label={`Distribuição: ${segments.map(s => `${s.n} ${s.label}`).join(', ')}`}
    >
      {segments.map(s => (
        <span
          key={s.key}
          className={cn('h-full transition-all', s.bg)}
          style={{ width: `${(s.n / total) * 100}%` }}
          title={`${s.n} ${s.label}`}
        />
      ))}
    </div>
  );
}
