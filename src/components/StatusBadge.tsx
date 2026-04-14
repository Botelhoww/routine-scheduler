import { RoutineStatus } from '@/types/routine';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const statusConfig: Record<RoutineStatus, { label: string; className: string }> = {
  idle: { label: 'Não iniciado', className: 'bg-muted text-muted-foreground' },
  running: { label: 'Em execução', className: 'bg-warning text-warning-foreground' },
  success: { label: 'Concluído', className: 'bg-success text-success-foreground' },
  error: { label: 'Erro', className: 'bg-destructive text-destructive-foreground' },
};

export function StatusBadge({ status }: { status: RoutineStatus }) {
  const { label, className } = statusConfig[status];
  return (
    <Badge variant="secondary" className={`${className} gap-1.5 font-medium`}>
      {status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
      {label}
    </Badge>
  );
}
