import { useEffect, useState, useMemo, useCallback } from 'react';
import { Routine, RoutinePeriod, RoutineStatus, DateReference } from '@/types/routine';
import { RoutineRow, RoutineRowHeader } from './RoutineRow';
import { AddRoutineDrawer } from './AddRoutineDrawer';
import { RoutineFiltersToolbar } from './RoutineFiltersToolbar';
import { BulkReprocessDialog } from './BulkReprocessDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { Moon, Sun, Sunrise, ChevronDown, AlertCircle, Loader2, CheckCircle2, Clock, Play, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { routineCanStart } from '@/lib/routine-eligibility';
import { toast } from 'sonner';

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
  onDeleteMany: (ids: string[]) => void;
  onStart: (id: string, reason?: string) => void;
  onReset: (id: string) => void;
  onAdd: (routine: any) => void;
}

export function RoutinePeriodList({ routines, onUpdate, onDelete, onDeleteMany, onStart, onReset, onAdd }: Props) {
  const [open, setOpen] = useState<Record<RoutinePeriod, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    const cur = currentPeriod();
    return { dawn: cur === 'dawn', morning: cur === 'morning', night: cur === 'night' };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<RoutineStatus>>(() => new Set());
  const [dateRefFilter, setDateRefFilter] = useState<Set<DateReference>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const [bulkReprocessOpen, setBulkReprocessOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(open));
  }, [open]);

  const toggle = (p: RoutinePeriod) => setOpen(s => ({ ...s, [p]: !s[p] }));

  const filteredRoutines = useMemo(
    () => applyRoutineFilters(routines, searchQuery, statusFilter, dateRefFilter),
    [routines, searchQuery, statusFilter, dateRefFilter],
  );

  useEffect(() => {
    const allowed = new Set(filteredRoutines.map(r => r.id));
    setSelectedIds(prev => new Set([...prev].filter(id => allowed.has(id))));
  }, [filteredRoutines]);

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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePeriodSelection = useCallback((periodIds: string[]) => {
    if (periodIds.length === 0) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allNow = periodIds.every(id => next.has(id));
      if (allNow) periodIds.forEach(id => next.delete(id));
      else periodIds.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const selectedRoutines = useMemo(
    () => routines.filter(r => selectedIds.has(r.id)),
    [routines, selectedIds],
  );

  const selectedCount = selectedIds.size;

  const bulkReprocessEligible = useMemo(
    () => selectedRoutines.filter(routineCanStart),
    [selectedRoutines],
  );
  const bulkReprocessSkipped = selectedRoutines.length - bulkReprocessEligible.length;

  const bulkDeleteEligible = useMemo(
    () => selectedRoutines.filter(r => r.status !== 'running'),
    [selectedRoutines],
  );
  const bulkDeleteSkipped = selectedRoutines.length - bulkDeleteEligible.length;

  const handleBulkReprocessConfirm = useCallback((reason?: string) => {
    bulkReprocessEligible.forEach(r => onStart(r.id, reason));
    toast.success(`${bulkReprocessEligible.length} reprocessamento(s) iniciado(s).`);
    setBulkReprocessOpen(false);
    setSelectedIds(new Set());
  }, [bulkReprocessEligible, onStart]);

  const handleBulkDeleteConfirm = useCallback(() => {
    if (bulkDeleteEligible.length === 0) {
      toast.error('Nenhuma rotina pode ser excluída (apenas em execução ou nada selecionado).');
      setBulkDeleteOpen(false);
      return;
    }
    onDeleteMany(bulkDeleteEligible.map(r => r.id));
    toast.success(`${bulkDeleteEligible.length} rotina(s) excluída(s).`);
    if (bulkDeleteSkipped > 0) {
      toast.message(`${bulkDeleteSkipped} em execução não ${bulkDeleteSkipped !== 1 ? 'foram excluídas' : 'foi excluída'}.`);
    }
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
  }, [bulkDeleteEligible, bulkDeleteSkipped, onDeleteMany]);

  const contentPt = selectedCount > 0 ? 'pt-[9.875rem]' : 'pt-[7.125rem]';

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
          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-t border-border bg-muted/40 text-xs">
              <span className="font-medium text-foreground">
                {selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="h-8 gap-1.5 bg-success text-success-foreground hover:bg-success/90"
                  disabled={bulkReprocessEligible.length === 0}
                  onClick={() => setBulkReprocessOpen(true)}
                >
                  <Play className="h-3.5 w-3.5" />
                  Reprocessar selecionadas
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-8 gap-1.5"
                  disabled={bulkDeleteEligible.length === 0}
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir selecionadas
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Limpar seleção
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={cn('space-y-3', contentPt)}>
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
              selectedIds={selectedIds}
              onSelectToggle={toggleSelect}
              onTogglePeriodSelection={togglePeriodSelection}
            />
          );
        })}
      </div>

      <BulkReprocessDialog
        open={bulkReprocessOpen}
        onOpenChange={setBulkReprocessOpen}
        eligibleCount={bulkReprocessEligible.length}
        skippedCount={bulkReprocessSkipped}
        skippedReason={bulkReprocessSkipped > 0 ? 'fora das regras de disparo (aguarde conclusão, erro, dados, etc.)' : undefined}
        onConfirm={handleBulkReprocessConfirm}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Excluir rotinas selecionadas"
        description={`Excluir ${bulkDeleteEligible.length} rotina(s)? Esta ação não pode ser desfeita.${
          bulkDeleteSkipped > 0
            ? ` ${bulkDeleteSkipped} rotina(s) em execução serão ignorada(s).`
            : ''
        }`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
      />
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
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onTogglePeriodSelection: (periodIds: string[]) => void;
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
  selectedIds,
  onSelectToggle,
  onTogglePeriodSelection,
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

  const idsInPeriod = useMemo(() => routines.map(r => r.id), [routines]);
  const allSelected = idsInPeriod.length > 0 && idsInPeriod.every(id => selectedIds.has(id));
  const someSelected = idsInPeriod.some(id => selectedIds.has(id));

  const toggleSelectAll = useCallback(() => {
    onTogglePeriodSelection(idsInPeriod);
  }, [idsInPeriod, onTogglePeriodSelection]);

  const selectAllProps = idsInPeriod.length === 0
    ? { checked: false as const, onToggle: () => {}, disabled: true }
    : {
        checked: (allSelected ? true : someSelected ? 'indeterminate' : false) as boolean | 'indeterminate',
        onToggle: toggleSelectAll,
      };

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
              Nenhuma rotina neste período com os filtros atuais.
            </div>
          ) : (
            <>
              <RoutineRowHeader selectAll={selectAllProps} />
              {routines.map(r => (
                <RoutineRow
                  key={r.id}
                  routine={r}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onStart={onStart}
                  onReset={onReset}
                  selected={selectedIds.has(r.id)}
                  onSelectToggle={onSelectToggle}
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
