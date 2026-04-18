import { useState, useEffect } from 'react';
import { Routine, RoutinePeriod } from '@/types/routine';
import { RoutineCard } from './RoutineCard';
import { AddRoutineDrawer } from './AddRoutineDrawer';
import { Moon, Sun, Sunrise } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const periodConfig: Record<RoutinePeriod, { title: string; time: string; icon: typeof Moon }> = {
  dawn: { title: 'Rotinas da Madrugada', time: '00h – 06h', icon: Moon },
  morning: { title: 'Rotinas Matutinas', time: '06h – 12h', icon: Sunrise },
  night: { title: 'Rotinas Noturnas', time: '18h – 00h', icon: Sun },
};

interface Props {
  period: RoutinePeriod;
  routines: Routine[];
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, reason?: string) => void;
  onReset: (id: string) => void;
  onAdd: (routine: any) => void;
}

export function RoutineSection({ period, routines, onUpdate, onDelete, onStart, onReset, onAdd }: Props) {
  const config = periodConfig[period];
  const Icon = config.icon;
  const totalPages = Math.max(1, Math.ceil(routines.length / ITEMS_PER_PAGE));
  const [page, setPage] = useState(1);

  // Auto-navigate to last page when routines are added
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(routines.length / ITEMS_PER_PAGE));
    if (page > newTotalPages) setPage(newTotalPages);
  }, [routines.length, page]);

  const handleAdd = (routine: any) => {
    onAdd(routine);
    const newTotal = routines.length + 1;
    const newLastPage = Math.ceil(newTotal / ITEMS_PER_PAGE);
    setPage(newLastPage);
  };

  const paginatedRoutines = routines.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const pageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-t-lg px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Icon className="h-5 w-5" />
          <div>
            <h2 className="font-semibold text-sm">{config.title}</h2>
            <p className="text-xs opacity-75">{config.time}</p>
          </div>
        </div>
        <span className="bg-primary-foreground/15 text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
          {routines.length} rotina{routines.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-card border border-t-0 border-border rounded-b-lg p-4 space-y-3 flex-1 flex flex-col">
        <div className="flex-1 space-y-3">
          {paginatedRoutines.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma rotina cadastrada</p>
          )}
          {paginatedRoutines.map(r => (
            <RoutineCard key={r.id} routine={r} onUpdate={onUpdate} onDelete={onDelete} onStart={onStart} onReset={onReset} />
          ))}
          {routines.length > 0 && paginatedRoutines.length < ITEMS_PER_PAGE && paginatedRoutines.length > 0 && (
            <div className="flex-1" />
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-7 px-2 text-xs">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {pageNumbers().map(p => (
              <Button key={p} variant={p === page ? 'default' : 'ghost'} size="sm" onClick={() => setPage(p)} className="h-7 w-7 p-0 text-xs">
                {p}
              </Button>
            ))}
            <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-7 px-2 text-xs">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground ml-2">Página {page} de {totalPages}</span>
          </div>
        )}

        <div className="pt-1">
          <AddRoutineDrawer period={period} onAdd={handleAdd} />
        </div>
      </div>
    </div>
  );
}
