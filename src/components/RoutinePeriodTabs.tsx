import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Routine, RoutinePeriod, RoutineStatus, DateReference } from '@/types/routine';
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
    if (dateRefFilter.size > 0 && !dateRefFilter.has(r.dateReference)) return false;
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

/**
 * Pagina por grupos inteiros: enche a página até atingir ROUTINES_PER_PAGE
 * sem quebrar grupos. Se o primeiro grupo de uma página já ultrapassa o
 * limite, ele entra inteiro mesmo assim (regra: nunca quebrar grupos).
 */
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
  const [dateRefFilter, setDateRefFilter] = useState<Set<DateReference>>(() => new Set());
  const [patternFilter, setPatternFilter] = useState<Set<ControlPattern>>(() => new Set());

  const [pageByPeriod, setPageByPeriod] = useState<Record<RoutinePeriod, number>>(() => loadPageState());

  // Grupos persistidos + derivados das rotinas
  const { groups, createGroup, getName } = useGroups(routines);

  // Sheets/dialogs
  const [sheetOpen, setSheetOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  // Detectar adição de rotina para saltar para a última página da aba ativa
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

  const toggleDateRef = useCallback((r: DateReference) => {
    setDateRefFilter(prev => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r); else next.add(r);
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
    dateRefFilter.size > 0 ||
    patternFilter.size > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter(new Set());
    setDateRefFilter(new Set());
    setPatternFilter(new Set());
    setPage(activeTab, 1);
  }, [activeTab, setPage]);

  // Contagens por aba (totais reais, sem filtros)
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
    () => applyRoutineFilters(
      routines.filter(r => r.period === activeTab),
      searchQuery, statusFilter, dateRefFilter, patternFilter,
    ),
    [routines, activeTab, searchQuery, statusFilter, dateRefFilter, patternFilter],
  );

  // Agrupar por sigla
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

  // Paginação por grupos inteiros
  const pages = useMemo(
    () => paginateByGroups(allSubgroups, ROUTINES_PER_PAGE),
    [allSubgroups],
  );
  const totalPages = pages.length;
  const rawCurrent = pageByPeriod[activeTab] ?? 1;
  const currentPage = Math.min(Math.max(1, rawCurrent), totalPages);
  const visibleSubgroups = pages[currentPage - 1] ?? [];

  // Se a página recortada saiu do intervalo (filtros mudaram, etc), ajustar.
  useEffect(() => {
    if (rawCurrent !== currentPage) setPage(activeTab, currentPage);
  }, [rawCurrent, currentPage, activeTab, setPage]);

  // Saltar para última página quando uma rotina é adicionada na aba ativa
  useEffect(() => {
    const prev = prevTotalsRef.current[activeTab];
    const now = periodTotals[activeTab];
    if (now > prev && prev !== 0) {
      // adição detectada — vai para a última página dos grupos atuais
      // Recalcula com base nos grupos atuais (sem filtros não importa: o efeito imediato é ir para a última).
      setPageByPeriod(prevState => ({ ...prevState, [activeTab]: totalPages }));
    }
    prevTotalsRef.current = { ...periodTotals };
  }, [periodTotals, activeTab, totalPages]);

  const visibleRoutineCount = visibleSubgroups.reduce((acc, g) => acc + g.routines.length, 0);
  const totalFilteredCount = filteredActiveRoutines.length;

  const summary = totalFilteredCount > 0
    ? `${visibleRoutineCount} de ${totalFilteredCount} rotina${totalFilteredCount !== 1 ? 's' : ''}`
    : undefined;

  return (
    <>
      {/* Barra de filtros (sticky) */}
      <div className="fixed top-[56px] left-0 right-0 z-40 border-b border-border bg-background">
        <div className="px-6">
          <RoutineFiltersToolbar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onToggleStatus={toggleStatus}
            dateRefFilter={dateRefFilter}
            onToggleDateRef={toggleDateRef}
            patternFilter={patternFilter}
            onTogglePattern={togglePattern}
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

      {/* Segmented control compacto */}
      <div className="fixed top-[100px] left-0 right-0 z-30 bg-background border-b border-border h-9">
        <div className="px-3 h-full flex items-center justify-between gap-3">
          <div role="tablist" className="inline-flex h-7 rounded-md border border-border bg-[hsl(var(--surface-muted))] p-0.5">
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
                    'h-full px-2.5 inline-flex items-center gap-1.5 rounded text-[12px] transition-colors',
                    isActive
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span aria-hidden className="text-[11px] leading-none opacity-90">{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                  <span className={cn('font-tech text-[10px] tabular-nums', isActive ? 'opacity-70' : 'opacity-60')}>
                    {c.total}
                  </span>
                  {c.error > 0 && (
                    <span className={cn(
                      'inline-flex items-center gap-1 font-tech text-[10px] font-medium tabular-nums',
                      isActive ? 'text-[hsl(var(--status-error)/0.95)]' : 'text-[hsl(var(--status-error))]',
                    )}>
                      <span className="status-dot status-dot--error" />{c.error}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {summary && (
            <span className="font-tech text-[10px] text-muted-foreground/80 tabular-nums">
              {summary}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="pt-[154px]">
        <div className="px-6 pt-6 pb-10 max-w-[1400px] mx-auto">
          {visibleSubgroups.length === 0 ? (
            <div className="border border-dashed border-border rounded-md py-12 text-center text-sm text-muted-foreground font-tech">
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

          {/* Paginação */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setPage(activeTab, p)}
            summary={summary}
          />

          {/* Rodapé da aba */}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGroupDialogOpen(true)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <FolderPlus className="h-3.5 w-3.5" /> novo grupo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSheetOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> nova rotina
            </Button>
          </div>
        </div>
      </div>

      {/* Sheet unificado em modo criação */}
      <RoutineSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        period={activeTab}
        groups={groups}
        onAdd={onAdd}
        onUpdate={() => { /* criação não usa onUpdate */ }}
        onCreateGroup={createGroup}
      />

      {/* Modal de novo grupo (rodapé) */}
      <AddGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        existingSiglas={groups.map(g => g.sigla)}
        onCreate={createGroup}
      />
    </>
  );
}
