import { ExecutionHistory as HistoryType } from '@/types/routine';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { History, CheckCircle2, XCircle } from 'lucide-react';

export function ExecutionHistoryPopover({ history }: { history: HistoryType[] }) {
  if (history.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <History className="h-4 w-4" />
          <span className="text-xs">Histórico ({history.length})</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <h4 className="font-semibold text-sm mb-3">Últimas execuções</h4>
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="flex items-start gap-2 text-xs border-b border-border pb-2 last:border-0">
              {h.status === 'success'
                ? <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{h.date}</span>
                  <span className="font-medium">{h.duration}</span>
                </div>
                {h.errorMessage && <p className="text-destructive mt-0.5 truncate">{h.errorMessage}</p>}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
