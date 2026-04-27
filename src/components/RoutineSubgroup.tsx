import { useEffect, useState, useMemo } from 'react';
import { Routine } from '@/types/routine';
import { RoutineCard } from './RoutineCard';
import { GroupOption } from './RoutineSheet';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'bsg-subgroup-collapse-state';

interface Props {
  sigla: string;
  name?: string;
  routines: Routine[];
  groups: GroupOption[];
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, reason?: string) => void;
  onReset: (id: string) => void;
  onCreateGroup: (sigla: string, name: string) => void;
}

const STATUS_PRIORITY: Record<Routine['status'], number> = {
  error: 0, running: 1, idle: 2, success: 3,
};

function loadCollapseState(): Record<string, boolean> {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); }
  catch { /* ignore */ }
  return {};
}
function saveCollapseState(state: Record<string, boolean>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function RoutineSubgroup({
  sigla, name, routines: rawRoutines, groups,
  onUpdate, onDelete, onStart, onReset, onCreateGroup,
}: Props) {
  const [open, setOpen] = useState<boolean>(() => loadCollapseState()[sigla] ?? true);

  useEffect(() => {
    const state = loadCollapseState();
    state[sigla] = open;
    saveCollapseState(state);
  }, [sigla, open]);

  const routines = useMemo(
    () => [...rawRoutines].sort((a, b) => {
      const diff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      if (diff !== 0) return diff;
      return (a.cod_rotina || a.name).localeCompare(b.cod_rotina || b.name);
    }),
    [rawRoutines],
  );

  const errorCount = routines.filter(r => r.status === 'error').length;
  const runningCount = routines.filter(r => r.status === 'running').length;

  return (
    <section className="mb-3">
      {/* GroupHeader compacto, sticky, fundo levemente cinza */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="sticky top-[136px] z-10 w-full h-7 flex items-center gap-2 px-3 bg-[hsl(var(--surface-muted))] border-y border-border text-left hover:bg-muted transition-colors"
      >
        <ChevronRight
          className={cn('h-3 w-3 text-muted-foreground/60 shrink-0 transition-transform', open && 'rotate-90')}
        />
        <span className="font-tech text-[11px] font-medium uppercase tracking-wider text-foreground">
          {sigla}
        </span>
        {name && name !== sigla && (
          <span className="text-[11px] text-muted-foreground truncate">· {name}</span>
        )}
        <span className="font-tech text-[10px] text-muted-foreground/70">({routines.length})</span>

        <span className="flex-1" aria-hidden />

        {runningCount > 0 && (
          <span className="inline-flex items-center gap-1 font-tech text-[10px] text-[hsl(var(--status-running))]">
            <span className="status-dot status-dot--running" />{runningCount}
          </span>
        )}
        {errorCount > 0 && (
          <span className="inline-flex items-center gap-1 font-tech text-[10px] font-medium text-[hsl(var(--status-error))]">
            <span className="status-dot status-dot--error" />{errorCount}
          </span>
        )}
      </button>

      {open && (
        <div className="border-x border-b border-border bg-[hsl(var(--surface))]">
          {routines.map(r => (
            <RoutineCard
              key={r.id}
              routine={r}
              groups={groups}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onStart={onStart}
              onReset={onReset}
              onCreateGroup={onCreateGroup}
            />
          ))}
        </div>
      )}
    </section>
  );
}
