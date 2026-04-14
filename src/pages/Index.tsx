import { useRoutines } from '@/hooks/useRoutines';
import { RoutineSection } from '@/components/RoutineSection';
import { AppHeader } from '@/components/AppHeader';
import { RoutinePeriod } from '@/types/routine';

const periods: RoutinePeriod[] = ['dawn', 'morning', 'night'];

export default function Index() {
  const { getByPeriod, addRoutine, updateRoutine, deleteRoutine, startReprocessing } = useRoutines();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container max-w-7xl mx-auto px-4 py-6 pt-[88px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
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
