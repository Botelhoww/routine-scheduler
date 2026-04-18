import { RoutineStatus, STATUS_API_MAP } from '@/types/routine';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const statusConfig: Record<RoutineStatus, { className: string }> = {
  idle:    { className: 'bg-muted text-muted-foreground' },
  running: { className: 'bg-info text-info-foreground' },
  success: { className: 'bg-success text-success-foreground' },
  error:   { className: 'bg-destructive text-destructive-foreground' },
};

export function StatusBadge({ status }: { status: RoutineStatus }) {
  const { className } = statusConfig[status];
  return (
    <Badge variant="secondary" className={`${className} gap-1.5 font-medium`}>
      {status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
      {STATUS_API_MAP[status]}
    </Badge>
  );
}
