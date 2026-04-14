import { ExecutionHistory } from '@/types/routine';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface Props {
  history: ExecutionHistory[];
  onClose: () => void;
}

export function InlineHistory({ history, onClose }: Props) {
  return (
    <div className="mt-3 border border-border rounded-lg overflow-hidden animate-accordion-down">
      <div className="flex items-center justify-between bg-muted px-3 py-2">
        <span className="text-xs font-semibold text-foreground">Últimas execuções</span>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="divide-y divide-border">
        {history.map(h => (
          <div key={h.id} className="flex items-center gap-2 px-3 py-2 text-xs">
            {h.status === 'success'
              ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
            <span className="text-muted-foreground flex-1">{h.date}</span>
            <span className="font-medium">{h.duration}</span>
            {h.executedBy && <span className="text-muted-foreground">por {h.executedBy}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
