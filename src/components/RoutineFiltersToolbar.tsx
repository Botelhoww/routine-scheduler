import { Search, Filter, CalendarRange, X, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { RoutineStatus, DateReference, STATUS_API_MAP } from '@/types/routine';
import { ControlPattern } from '@/types/control-pattern';
import { cn } from '@/lib/utils';

const ALL_STATUSES: RoutineStatus[] = ['idle', 'running', 'success', 'error'];
const ALL_REFS: DateReference[] = ['D-1', 'D0', 'D+1'];
const ALL_PATTERNS: ControlPattern[] = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: Set<RoutineStatus>;
  onToggleStatus: (s: RoutineStatus) => void;
  dateRefFilter: Set<DateReference>;
  onToggleDateRef: (r: DateReference) => void;
  patternFilter: Set<ControlPattern>;
  onTogglePattern: (p: ControlPattern) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function RoutineFiltersToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onToggleStatus,
  dateRefFilter,
  onToggleDateRef,
  patternFilter,
  onTogglePattern,
  onClearFilters,
  hasActiveFilters,
  rightSlot,
  className,
}: Props) {
  const statusCount = statusFilter.size;
  const refCount = dateRefFilter.size;
  const patternCount = patternFilter.size;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 h-11 px-2 border-b border-border bg-background',
        className,
      )}
    >
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <Input
          placeholder="Buscar por nome ou código..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="h-9 pl-8 text-xs"
          aria-label="Buscar rotina por nome ou código"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs shrink-0">
            <Filter className="h-3.5 w-3.5" />
            Status
            {statusCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                {statusCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</p>
          <div className="space-y-2">
            {ALL_STATUSES.map(s => (
              <label key={s} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={statusFilter.has(s)}
                  onCheckedChange={() => onToggleStatus(s)}
                />
                <span>{STATUS_API_MAP[s]}</span>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border">
            Nenhuma opção = todos os status.
          </p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs shrink-0">
            <CalendarRange className="h-3.5 w-3.5" />
            Referência
            {refCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                {refCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="start">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Data de referência</p>
          <div className="space-y-2">
            {ALL_REFS.map(r => (
              <label key={r} className="flex items-center gap-2 text-xs cursor-pointer font-mono">
                <Checkbox
                  checked={dateRefFilter.has(r)}
                  onCheckedChange={() => onToggleDateRef(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border">
            Nenhuma opção = todas as referências.
          </p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs shrink-0">
            <Layers className="h-3.5 w-3.5" />
            Padrão
            {patternCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                {patternCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="start">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Padrão de controle</p>
          <div className="space-y-2">
            {ALL_PATTERNS.map(p => (
              <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={patternFilter.has(p)}
                  onCheckedChange={() => onTogglePattern(p)}
                />
                <span>Padrão {p}</span>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border">
            Nenhuma opção = todos os padrões.
          </p>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 text-xs shrink-0 text-muted-foreground"
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Limpar filtros
      </Button>

      {rightSlot && <div className="ml-auto flex items-center">{rightSlot}</div>}
    </div>
  );
}
