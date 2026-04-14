import { Routine, RoutinePeriod } from '@/types/routine';
import { RoutineCard } from './RoutineCard';
import { AddRoutineDrawer } from './AddRoutineDrawer';
import { Moon, Sun, Sunrise } from 'lucide-react';

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
  onStart: (id: string) => void;
  onAdd: (routine: any) => void;
}

export function RoutineSection({ period, routines, onUpdate, onDelete, onStart, onAdd }: Props) {
  const config = periodConfig[period];
  const Icon = config.icon;

  return (
    <div className="flex flex-col">
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

      <div className="bg-card border border-t-0 border-border rounded-b-lg p-4 space-y-3 flex-1">
        {routines.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma rotina cadastrada</p>
        )}
        {routines.map(r => (
          <RoutineCard key={r.id} routine={r} onUpdate={onUpdate} onDelete={onDelete} onStart={onStart} />
        ))}
        <div className="pt-1">
          <AddRoutineDrawer period={period} onAdd={onAdd} />
        </div>
      </div>
    </div>
  );
}
