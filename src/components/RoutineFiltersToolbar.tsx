import { Search, Filter, X, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { RoutineStatus, STATUS_API_MAP } from '@/types/routine';
import { ControlPattern } from '@/types/control-pattern';
import { cn } from '@/lib/utils';

const ALL_STATUSES: RoutineStatus[] = ['idle', 'running', 'success', 'error'];
const ALL_PATTERNS: ControlPattern[] = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: Set<RoutineStatus>;
  onToggleStatus: (s: RoutineStatus) => void;
  patternFilter: Set<ControlPattern>;
  onTogglePattern: (p: ControlPattern) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function RoutineFiltersToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onToggleStatus,
  patternFilter,
  onTogglePattern,
  onClearFilters,
  hasActiveFilters,
  className,
}: Props) {
  const statusCount = statusFilter.size;
  const patternCount = patternFilter.size;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative w-[220px]">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" aria-hidden />
        <Input
          placeholder="Buscar nome ou código…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="h-7 pl-7 pr-2 text-[12px]"
          aria-label="Buscar rotina por nome ou código"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-[12px] text-muted-foreground hover:text-foreground">
            <Filter className="h-3 w-3" />
            status
            {statusCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] font-normal">{statusCount}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2.5" align="start">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Status</p>
          <div className="space-y-1.5">
            {ALL_STATUSES.map(s => (
              <label key={s} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={statusFilter.has(s)} onCheckedChange={() => onToggleStatus(s)} />
                <span>{STATUS_API_MAP[s]}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-[12px] text-muted-foreground hover:text-foreground">
            <Layers className="h-3 w-3" />
            padrão
            {patternCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] font-normal">{patternCount}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-2.5" align="start">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Padrão</p>
          <div className="space-y-1.5">
            {ALL_PATTERNS.map(p => (
              <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={patternFilter.has(p)} onCheckedChange={() => onTogglePattern(p)} />
                <span>Padrão {p}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={onClearFilters}
        >
          <X className="h-3 w-3 mr-0.5" />
          limpar
        </Button>
      )}
    </div>
  );
}
