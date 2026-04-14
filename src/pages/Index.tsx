import { useRoutines } from '@/hooks/useRoutines';
import { RoutineSection } from '@/components/RoutineSection';
import { RoutinePeriod } from '@/types/routine';
import { RefreshCcw } from 'lucide-react';

const periods: RoutinePeriod[] = ['dawn', 'morning', 'night'];

export default function Index() {
  const { getByPeriod, addRoutine, updateRoutine, deleteRoutine, startReprocessing } = useRoutines();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2">
            <RefreshCcw className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Reprocessamento de Rotinas</h1>
            <p className="text-xs text-muted-foreground">Banco de Investimentos — Painel Administrativo</p>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {periods.map(period => (
            <RoutineSection
              key={period}
              period={period}
              routines={getByPeriod(period)}
              onUpdate={updateRoutine}
              onDelete={deleteRoutine}
              onStart={startReprocessing}
              onAdd={addRoutine}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
