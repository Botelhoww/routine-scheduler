import { useEffect, useState, useMemo, useCallback } from 'react';
import { Routine, RoutinePeriod, RoutineStatus, DateReference } from '@/types/routine';
import { RoutineSubgroup } from './RoutineSubgroup';
import { AddRoutineDrawer } from './AddRoutineDrawer';
import { RoutineFiltersToolbar } from './RoutineFiltersToolbar';
import { RefreshControl } from './RefreshControl';
import { cn } from '@/lib/utils';

const TAB_STORAGE_KEY = 'bsg-active-period-tab';

const periodConfig: Record<RoutinePeriod, { label: string; time: string; emoji: string }> = {
  dawn:    { label: 'Madrugada', time: '00h – 06h', emoji: '🌙' },
  morning: { label: 'Matutino',  time: '06h – 12h', emoji: '☀️' },
  night:   { label: 'Noturno',   time: '18h – 00h', emoji: '🌆' },
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
  onRefresh: () => void | Promise<void>;
  isRefreshing: boolean;
  lastUpdated: Date;
}

export function RoutinePeriodTabs({
  routines, onUpdate, onDelete, onStart, onReset, onAdd,
  onRefresh, isRefreshing, lastUpdated,
}: Props) {
  const [activeTab, setActiveTab] = useState<RoutinePeriod>(() => {
    try {
      const raw = localStorage.getItem(TAB_STORAGE_KEY);
      if (raw && (raw === 'dawn' || raw === 'morning' || raw === 'night')) {
        return raw as RoutinePeriod;
      }
    } catch { /* ignore */ }
    return currentPeriod();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<RoutineStatus>>(() => new Set());
  const [dateRefFilter, setDateRefFilter] = useState<Set<DateReference>>(() => new Set());

  useEffect(() => {
    try { localStorage.setItem(TAB_STORAGE_KEY, activeTab); } catch { /* ignore */ }
  }, [activeTab]);

  const toggleStatus = useCallback((s: RoutineStatus) => {
    setStatusFilter(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }, []);

  const toggleDateRef = useCallback((r: DateReference) => {
    setDateRefFilter(prev => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r); else next.add(r);
      return next;
    });
  }, []);

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter.size > 0 || dateRefFilter.size > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter(new Set());
    setDateRefFilter(new Set());
  }, []);

  // Contagens por aba (sem filtros aplicados, para o badge mostrar o total real)
  const counts = useMemo(() => {
    const result: Record<RoutinePeriod, { total: number; error: number }> = {
      dawn:    { total: 0, error: 0 },
      morning: { total: 0, error: 0 },
      night:   { total: 0, error: 0 },
    };
    for (const r of routines) {
      result[r.period].total += 1;
      if (r.status === 'error') result[r.period].error += 1;
    }
    return result;
  }, [routines]);

  // Rotinas filtradas da aba ativa
  const filteredActiveRoutines = useMemo(
    () => applyRoutineFilters(routines.filter(r => r.period === activeTab), searchQuery, statusFilter, dateRefFilter),
    [routines, activeTab, searchQuery, statusFilter, dateRefFilter],
  );

  // Agrupar por sigla (campo grupo). Rotinas sem grupo vão para "GERAL".
  const subgroups = useMemo(() => {
    const map = new Map<string, Routine[]>();
    for (const r of filteredActiveRoutines) {
      const key = (r.grupo && r.grupo.trim()) || 'GERAL';
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sigla, list]) => ({ sigla, routines: list }));
  }, [filteredActiveRoutines]);

  return (
    <>
      {/* Barra de filtros (sticky, abaixo do header de 56px) */}
      <div className="fixed top-[56px] left-0 right-0 z-40 border-b border-[#E8E8E8] bg-white">
        <div className="px-6">
          <RoutineFiltersToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onToggleStatus={toggleStatus}
            dateRefFilter={dateRefFilter}
            onToggleDateRef={toggleDateRef}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            rightSlot={
              <RefreshControl
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                lastUpdated={lastUpdated}
              />
            }
          />
        </div>
      </div>

      {/* Barra de abas (sticky, abaixo da barra de filtros) */}
      <div className="fixed top-[110px] left-0 right-0 z-30 bg-white border-b border-[#E8E8E8] h-[48px]">
        <div className="px-6 h-full">
          <div role="tablist" className="flex items-center h-full gap-1">
            {periods.map(p => {
              const cfg = periodConfig[p];
              const c = counts[p];
              const isActive = activeTab === p;
              return (
                <button
                  key={p}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(p)}
                  className={cn(
                    'h-full px-4 flex items-center gap-2 border-b-2 transition-colors text-[13px]',
                    isActive
                      ? 'border-[#E30613] text-[#1a1a1a] font-medium'
                      : 'border-transparent text-[#666] hover:text-[#1a1a1a]',
                  )}
                >
                  <span aria-hidden>{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                  <span className="text-[11px] text-[#888]">· {cfg.time}</span>
                  <span className="ml-1 inline-flex items-center bg-[#F0F0F0] text-[#666] text-[11px] rounded-full px-2 py-0.5">
                    {c.total} rotina{c.total !== 1 ? 's' : ''}
                  </span>
                  {c.error > 0 && (
                    <span className="inline-flex items-center bg-[#FEE2E2] text-[#E30613] text-[11px] rounded-full px-2 py-0.5">
                      {c.error} erro{c.error !== 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="pt-[158px]">
        <div className="px-6 pt-5 pb-6">
          {subgroups.length === 0 ? (
            <div className="bg-white border border-[#E2E4E8] rounded-[10px] py-10 text-center text-sm text-[#888]">
              Nenhuma rotina neste período com os filtros atuais.
            </div>
          ) : (
            subgroups.map(({ sigla, routines: list }) => (
              <RoutineSubgroup
                key={sigla}
                sigla={sigla}
                routines={list}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onStart={onStart}
                onReset={onReset}
              />
            ))
          )}

          {/* Rodapé da aba */}
          <div className="mt-2 flex justify-end">
            <AddRoutineDrawer period={activeTab} onAdd={onAdd} />
          </div>
        </div>
      </div>
    </>
  );
}
