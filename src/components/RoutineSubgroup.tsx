import { useEffect, useState, useMemo } from 'react';
import { Routine } from '@/types/routine';
import { RoutineCard } from './RoutineCard';
import { GroupOption } from './RoutineSheet';
import { ChevronDown } from 'lucide-react';
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

  return (
    <section className="bg-white border border-[#E2E4E8] border-t-2 border-t-[#E30613] rounded-[10px] overflow-hidden mb-5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F8F9FB] border-b border-[#E2E4E8] hover:bg-[#F0F2F5] transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center bg-[#E8EDF5] text-[#0A2540] text-[11px] font-semibold rounded px-2 py-0.5">
            {sigla}
          </span>
          <span className="text-[13px] font-medium text-[#1a1a1a] truncate">
            {name || sigla}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[12px] text-[#888]">
            {routines.length} rotina{routines.length !== 1 ? 's' : ''}
          </span>
          {errorCount > 0 && (
            <span className="inline-flex items-center bg-[#FEE2E2] text-[#E30613] text-[11px] rounded px-2 py-0.5">
              {errorCount} erro{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          <ChevronDown
            className={cn('h-3 w-3 text-[#aaa] transition-transform duration-200', open && 'rotate-180')}
          />
        </div>
      </button>

      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
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
    </section>
  );
}
