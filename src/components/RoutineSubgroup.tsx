import { useEffect, useState, useMemo } from 'react';
import { Routine } from '@/types/routine';
import { RoutineCard } from './RoutineCard';
import { GroupOption } from './RoutineSheet';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'bsg-subgroup-collapse-state';

interface Props {
  sigla: string;
  /** Nome descritivo do grupo */
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
  error: 0,
  running: 1,
  idle: 2,
  success: 3,
};

function loadCollapseState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveCollapseState(state: Record<string, boolean>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function RoutineSubgroup({
  sigla, name, routines: rawRoutines, groups,
  onUpdate, onDelete, onStart, onReset, onCreateGroup,
}: Props) {
  const [open, setOpen] = useState<boolean>(() => {
    const state = loadCollapseState();
    return state[sigla] ?? true;
  });

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
    <section className="mb-8">
      {/* Cabeçalho do grupo — discreto, tipo "comentário de seção" */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 mb-2 text-left group"
        aria-expanded={open}
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 text-muted-foreground/50 transition-transform duration-200 shrink-0',
            open && 'rotate-90',
          )}
        />
        <span className="font-tech text-[11px] uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {sigla}
        </span>
        {name && name !== sigla && (
          <span className="text-[12px] text-muted-foreground/80 truncate">
            · {name}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground/60 font-tech">
          ({routines.length})
        </span>

        {/* Indicadores só quando há atenção devida */}
        {runningCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-tech text-[hsl(var(--status-running))]">
            <span className="status-dot status-dot--running" />
            {runningCount} rodando
          </span>
        )}
        {errorCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-tech text-[hsl(var(--status-error))]">
            <span className="status-dot status-dot--error" />
            {errorCount} erro{errorCount !== 1 ? 's' : ''}
          </span>
        )}

        {/* linha sutil ocupando o restante */}
        <span className="flex-1 h-px bg-border ml-2" aria-hidden />
      </button>

      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="bg-[hsl(var(--surface))] border border-border rounded-md overflow-hidden">
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
        </div>
      </div>
    </section>
  );
}
