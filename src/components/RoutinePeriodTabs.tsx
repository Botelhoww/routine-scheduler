import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Routine, RoutinePeriod, RoutineStatus } from '@/types/routine';
import { ControlPattern } from '@/types/control-pattern';
import { RoutineSubgroup } from './RoutineSubgroup';
import { RoutineSheet } from './RoutineSheet';
import { AddGroupDialog } from './AddGroupDialog';
import { RoutineFiltersToolbar } from './RoutineFiltersToolbar';
import { RefreshControl } from './RefreshControl';
import { PaginationControls } from './PaginationControls';
import { useGroups } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const TAB_STORAGE_KEY = 'bsg-active-period-tab';
const PAGE_STORAGE_KEY = 'bsg-period-page-state';
const ROUTINES_PER_PAGE = 10;

const periodConfig: Record<RoutinePeriod, { label: string }> = {
  dawn:    { label: 'Madrugada' },
  morning: { label: 'Matutino' },
  night:   { label: 'Noturno' },
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
  patternFilter: Set<ControlPattern>,
): Routine[] {
  const needle = q.trim().toLowerCase();
  return routines.filter(r => {
    if (needle) {
      const code = (r.cod_rotina || '').toLowerCase();
      const name = r.name.toLowerCase();
      if (!code.includes(needle) && !name.includes(needle)) return false;
    }
    if (statusFilter.size > 0 && !statusFilter.has(r.status)) return false;
    if (patternFilter.size > 0 && !patternFilter.has(r.tipo_controle)) return false;
    return true;
  });
}

function loadPageState(): Record<RoutinePeriod, number> {
  try {
    const raw = localStorage.getItem(PAGE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        dawn:    typeof parsed.dawn === 'number'    ? parsed.dawn    : 1,
        morning: typeof parsed.morning === 'number' ? parsed.morning : 1,
        night:   typeof parsed.night === 'number'   ? parsed.night   : 1,
      };
    }
  } catch { /* ignore */ }
  return { dawn: 1, morning: 1, night: 1 };
}

function savePageState(state: Record<RoutinePeriod, number>) {
  try { localStorage.setItem(PAGE_STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

interface SubgroupChunk {
  sigla: string;
  routines: Routine[];
}

function paginateByGroups(groups: SubgroupChunk[], perPage: number): SubgroupChunk[][] {
  const pages: SubgroupChunk[][] = [];
  let current: SubgroupChunk[] = [];
  let currentCount = 0;

  for (const g of groups) {
    if (current.length === 0) {
      current.push(g);
      currentCount = g.routines.length;
      continue;
    }
    if (currentCount + g.routines.length <= perPage) {
      current.push(g);
      currentCount += g.routines.length;
    } else {
      pages.push(current);
      current = [g];
      currentCount = g.routines.length;
    }
  }
  if (current.length > 0) pages.push(current);
  return pages.length > 0 ? pages : [[]];
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
      if (raw === 'dawn' || raw === 'morning' || raw === 'night') return raw;
    } catch { /* ignore */ }
    return currentPeriod();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<RoutineStatus>>(() => new Set());
  const [patternFilter, setPatternFilter] = useState<Set<ControlPattern>>(() => new Set());

  const [pageByPeriod, setPageByPeriod] = useState<Record<RoutinePeriod, number>>(() => loadPageState());

  const { groups, createGroup, getName } = useGroups(routines);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  const prevTotalsRef = useRef<Record<RoutinePeriod, number>>({
    dawn: 0, morning: 0, night: 0,
  });
  const periodTotals = useMemo(() => {
    const t = { dawn: 0, morning: 0, night: 0 } as Record<RoutinePeriod, number>;
    for (const r of routines) t[r.period] += 1;
    return t;
  }, [routines]);

  useEffect(() => {
    try { localStorage.setItem(TAB_STORAGE_KEY, activeTab); } catch { /* ignore */ }
  }, [activeTab]);

  useEffect(() => {
    savePageState(pageByPeriod);
  }, [pageByPeriod]);

  const setPage = useCallback((period: RoutinePeriod, page: number) => {
    setPageByPeriod(prev => ({ ...prev, [period]: page }));
  }, []);

  const toggleStatus = useCallback((s: RoutineStatus) => {
    setStatusFilter(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
    setPage(activeTab, 1);
  }, [activeTab, setPage]);

  const togglePattern = useCallback((p: ControlPattern) => {
    setPatternFilter(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
    setPage(activeTab, 1);
  }, [activeTab, setPage]);

  const handleSearchChange = useCallback((v: string) => {
    setSearchQuery(v);
    setPage(activeTab, 1);
  }, [activeTab, setPage]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter.size > 0 ||
    patternFilter.size > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter(new Set());
    setPatternFilter(new Set());
    setPage(activeTab, 1);
  }, [activeTab, setPage]);

  // Counts: total e em erro por período
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

  const filteredActiveRoutines = useMemo(
    () => applyRoutineFilters(
      routines.filter(r => r.period === activeTab),
      searchQuery, statusFilter, patternFilter,
    ),
    [routines, activeTab, searchQuery, statusFilter, patternFilter],
  );

  const allSubgroups = useMemo<SubgroupChunk[]>(() => {
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

  const pages = useMemo(
    () => paginateByGroups(allSubgroups, ROUTINES_PER_PAGE),
    [allSubgroups],
  );
  const totalPages = pages.length;
  const rawCurrent = pageByPeriod[activeTab] ?? 1;
  const currentPage = Math.min(Math.max(1, rawCurrent), totalPages);
  const visibleSubgroups = pages[currentPage - 1] ?? [];

  useEffect(() => {
    if (rawCurrent !== currentPage) setPage(activeTab, currentPage);
  }, [rawCurrent, currentPage, activeTab, setPage]);

  useEffect(() => {
    const prev = prevTotalsRef.current[activeTab];
    const now = periodTotals[activeTab];
    if (now > prev && prev !== 0) {
      setPageByPeriod(prevState => ({ ...prevState, [activeTab]: totalPages }));
    }
    prevTotalsRef.current = { ...periodTotals };
  }, [periodTotals, activeTab, totalPages]);

  const visibleRoutineCount = visibleSubgroups.reduce((acc, g) => acc + g.routines.length, 0);
  const totalFilteredCount = filteredActiveRoutines.length;

  const summary = totalFilteredCount > 0
    ? `${visibleRoutineCount} de ${totalFilteredCount}`
    : undefined;

  return (
    <>
      {/* Barra única e densa: filtros + abas de período + refresh */}
      <div className="fixed top-[56px] left-0 right-0 z-40 bg-background border-b border-border">
        <div className="px-3 h-9 flex items-center gap-3">
          {/* Filtros à esquerda */}
          <RoutineFiltersToolbar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onToggleStatus={toggleStatus}
            patternFilter={patternFilter}
            onTogglePattern={togglePattern}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Separador */}
          <span className="h-4 w-px bg-border" aria-hidden />

          {/* Abas de período: texto inline, sem fundo */}
          <div role="tablist" className="inline-flex items-center gap-3">
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
                    'inline-flex items-baseline gap-1 text-[12px] py-1 border-b-[1.5px] transition-colors',
                    isActive
                      ? 'border-foreground text-foreground font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span>{cfg.label}</span>
                  <span className={cn(
                    'font-tech text-[11px] tabular-nums',
                    isActive ? 'opacity-80' : 'opacity-60',
                  )}>
                    {c.total}
                    {c.error > 0 && (
                      <>
                        <span className="opacity-50">/</span>
                        <span className="text-[hsl(var(--status-error))] font-medium">{c.error}</span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Direita: resumo + refresh */}
          <div className="ml-auto flex items-center gap-3">
            {summary && (
              <span className="font-tech text-[11px] text-muted-foreground/80 tabular-nums">
                {summary}
              </span>
            )}
            <RefreshControl
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
              lastUpdated={lastUpdated}
            />
          </div>
        </div>
      </div>

      {/* Conteúdo da aba ativa — começa imediatamente abaixo da barra única */}
      <div className="pt-[92px]">
        <div className="px-3 pt-2 pb-8">
          {visibleSubgroups.length === 0 ? (
            <div className="border border-dashed border-border rounded-md py-10 text-center text-[12px] text-muted-foreground font-tech">
              # nenhuma rotina neste período com os filtros atuais
            </div>
          ) : (
            visibleSubgroups.map(({ sigla, routines: list }) => (
              <RoutineSubgroup
                key={sigla}
                sigla={sigla}
                name={getName(sigla)}
                routines={list}
                groups={groups}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onStart={onStart}
                onReset={onReset}
                onCreateGroup={createGroup}
              />
            ))
          )}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setPage(activeTab, p)}
            summary={summary}
          />

          <div className="mt-4 flex justify-end gap-1">
            <Button
              variant="ghost" size="sm"
              onClick={() => setGroupDialogOpen(true)}
              className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <FolderPlus className="h-3 w-3" /> novo grupo
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setSheetOpen(true)}
              className="h-7 gap-1.5 text-[11px]"
            >
              <Plus className="h-3 w-3" /> nova rotina
            </Button>
          </div>
        </div>
      </div>

      <RoutineSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        period={activeTab}
        groups={groups}
        onAdd={onAdd}
        onUpdate={() => { /* criação não usa onUpdate */ }}
        onCreateGroup={createGroup}
      />

      <AddGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        existingSiglas={groups.map(g => g.sigla)}
        onCreate={createGroup}
      />
    </>
  );
}
